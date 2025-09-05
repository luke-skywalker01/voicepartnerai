import { NextRequest, NextResponse } from 'next/server'
import { withAuthOrDemo } from '@/lib/auth/middleware'
import { db, checkWorkflowLimit } from '@/lib/database'

export async function GET(request: NextRequest) {
  return withAuthOrDemo(request, async (req, user) => {
    try {
      // If demo mode, return demo workflows
      if (user.id.startsWith('demo-user-')) {
        const workflows = [
          {
            id: '1',
            name: 'Kundenservice Workflow',
            description: 'Automatischer Kundenservice mit Eskalation zu menschlichen Agenten',
            status: 'active',
            category: 'customer-service',
            template: false,
            nodes: [
              {
                id: '1',
                type: 'trigger',
                title: 'Eingehender Anruf',
                x: 100,
                y: 100,
                data: { triggerType: 'incoming_call' }
              },
              {
                id: '2',
                type: 'voice_response',
                title: 'Begrüßung',
                x: 300,
                y: 100,
                data: { message: 'Hallo! Wie kann ich Ihnen heute helfen?' }
              }
            ],
            connections: [
              { from: '1', to: '2' }
            ],
            triggers: 3,
            steps: 8,
            executions: 1247,
            successRate: 94,
            lastRun: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
        
        return NextResponse.json({
          success: true,
          data: workflows,
          total: workflows.length
        })
      }

      // Production mode: fetch from database
      const workflows = await db.workflow.findMany({
        where: { 
          tenantId: user.tenantId,
          userId: user.id 
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          executions: {
            take: 1,
            orderBy: { startedAt: 'desc' }
          },
          _count: {
            select: { executions: true }
          }
        }
      })

      // Transform data for frontend
      const transformedWorkflows = workflows.map(workflow => {
        const workflowDataParsed = workflow.workflowData as any
        return {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || '',
          status: workflow.status,
          category: 'general',
          template: false,
          nodes: workflowDataParsed?.nodes || [],
          connections: workflowDataParsed?.edges || [],
          triggers: 0,
          steps: workflowDataParsed?.nodes?.length || 0,
          executions: workflow._count.executions,
          successRate: 0, // TODO: Calculate from executions
          lastRun: workflow.executions[0]?.startedAt || workflow.updatedAt,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt
        }
      })

      return NextResponse.json({
        success: true,
        data: transformedWorkflows,
        total: transformedWorkflows.length
      })
    } catch (error) {
      console.error('Error fetching workflows:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch workflows' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuthOrDemo(request, async (req, user) => {
    try {
      const body = await request.json()
      
      if (!body.name) {
        return NextResponse.json(
          { success: false, error: 'Workflow name is required' },
          { status: 400 }
        )
      }

      // Check workflow limits for subscription tier
      if (!user.id.startsWith('demo-user-')) {
        const canCreateWorkflow = await checkWorkflowLimit(user.id)
        if (!canCreateWorkflow) {
          return NextResponse.json(
            { success: false, error: 'Workflow limit reached for your subscription tier' },
            { status: 403 }
          )
        }
      }

      // Demo mode: return mock workflow
      if (user.id.startsWith('demo-user-')) {
        const newWorkflow = {
          id: Date.now().toString(),
          name: body.name,
          description: body.description || '',
          status: 'draft',
          category: body.category || 'general',
          template: body.template || false,
          nodes: body.nodes || [],
          connections: body.connections || [],
          triggers: 0,
          steps: body.nodes?.length || 0,
          executions: 0,
          successRate: 0,
          lastRun: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        return NextResponse.json({
          success: true,
          data: newWorkflow
        }, { status: 201 })
      }

      // Production mode: save to database
      const workflowData = {
        nodes: body.nodes || [],
        edges: body.connections || []
      }

      const workflow = await db.workflow.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          name: body.name,
          description: body.description || '',
          workflowData: workflowData,
          status: 'draft'
        }
      })

      const transformedWorkflow = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        status: workflow.status,
        category: 'general',
        template: false,
        nodes: workflowData.nodes,
        connections: workflowData.edges,
        triggers: 0,
        steps: workflowData.nodes.length,
        executions: 0,
        successRate: 0,
        lastRun: workflow.updatedAt,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      }

      return NextResponse.json({
        success: true,
        data: transformedWorkflow
      }, { status: 201 })
    } catch (error) {
      console.error('Error creating workflow:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create workflow' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuthOrDemo(request, async (req, user) => {
    try {
      const body = await request.json()
      const { id, ...updateData } = body

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Workflow ID is required' },
          { status: 400 }
        )
      }

      // Demo mode: simulate update
      if (user.id.startsWith('demo-user-')) {
        const updatedWorkflow = {
          id: id,
          ...updateData,
          steps: updateData.nodes?.length || 0,
          updatedAt: new Date().toISOString()
        }

        return NextResponse.json({
          success: true,
          data: updatedWorkflow
        })
      }

      // Production mode: update in database
      const workflowData = {
        nodes: updateData.nodes || [],
        edges: updateData.connections || []
      }

      const workflow = await db.workflow.update({
        where: { 
          id: id,
          tenantId: user.tenantId,
          userId: user.id
        },
        data: {
          name: updateData.name,
          description: updateData.description,
          workflowData: workflowData,
          status: updateData.status
        }
      })

      const transformedWorkflow = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        status: workflow.status,
        category: 'general',
        template: false,
        nodes: workflowData.nodes,
        connections: workflowData.edges,
        triggers: 0,
        steps: workflowData.nodes.length,
        executions: 0,
        successRate: 0,
        lastRun: workflow.updatedAt,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      }

      return NextResponse.json({
        success: true,
        data: transformedWorkflow
      })
    } catch (error) {
      console.error('Error updating workflow:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update workflow' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withAuthOrDemo(request, async (req, user) => {
    try {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Workflow ID is required' },
          { status: 400 }
        )
      }

      // Demo mode: simulate deletion
      if (user.id.startsWith('demo-user-')) {
        return NextResponse.json({
          success: true,
          message: 'Workflow deleted successfully'
        })
      }

      // Production mode: delete from database
      await db.workflow.delete({
        where: { 
          id: id,
          tenantId: user.tenantId,
          userId: user.id
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Workflow deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting workflow:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete workflow' },
        { status: 500 }
      )
    }
  })
}