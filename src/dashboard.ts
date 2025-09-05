// Dashboard TypeScript module
import { Assistant, Template, ValidationResult } from './types/index.js';

class VoicePartnerAIDashboard {
    private selectedTemplate: string | null = null;
    
    constructor() {
        this.init();
    }
    
    private init(): void {
        console.log('=€ VoicePartnerAI Dashboard 2.0 - TypeScript Version loaded');
        this.setupEventListeners();
        this.loadSavedAssistants();
    }
    
    private setupEventListeners(): void {
        // Template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (event) => {
                this.selectTemplate(event.currentTarget as HTMLElement);
            });
        });
        
        // User menu
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });
    }
    
    public showSection(section: string): void {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => (s as HTMLElement).style.display = 'none');
        
        // Remove active from all nav items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        // Show selected section
        const targetSection = document.getElementById(section + '-section');
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        console.log(` Switched to ${section} section`);
    }
    
    private selectTemplate(card: HTMLElement): void {
        // Remove selection from all cards
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
        
        // Select this card
        card.classList.add('selected');
        this.selectedTemplate = card.dataset.template || null;
        
        console.log(` Selected template: ${this.selectedTemplate}`);
        
        // Auto-open create modal after selection
        setTimeout(() => {
            this.openCreateModal(this.selectedTemplate);
        }, 300);
    }
    
    public openCreateModal(template: string | null = null): void {
        const modal = document.getElementById('createModal');
        const nameInput = document.getElementById('assistantName') as HTMLInputElement;
        
        if (template && nameInput) {
            this.selectedTemplate = template;
            const templateNames: Record<string, string> = {
                'customer-support': 'Customer Support Assistant',
                'appointment-setter': 'Appointment Scheduler',
                'lead-qualifier': 'Lead Qualification Agent',
                'phone-handler': 'Phone Call Handler',
                'web-assistant': 'Web Call Assistant',
                'sales-agent': 'Sales Assistant',
                'healthcare': 'Healthcare Assistant',
                'blank': 'Custom Assistant'
            };
            nameInput.value = templateNames[template] || 'New Assistant';
        }
        
        modal?.classList.add('show');
        nameInput?.focus();
        
        console.log(` Opened create modal for template: ${template || 'none'}`);
    }
    
    public createAssistant(): void {
        const nameInput = document.getElementById('assistantName') as HTMLInputElement;
        const name = nameInput?.value || 'Untitled Assistant';
        
        console.log('=€ Creating assistant...', { name, template: this.selectedTemplate });
        
        // Show success message
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.style.display = 'block';
            successMsg.innerHTML = `<i class="fas fa-check-circle"></i> Assistant "${name}" created successfully with ${this.selectedTemplate || 'blank'} template!`;
        }
        
        // Close modal and redirect to assistant editor
        setTimeout(() => {
            this.closeModal();
            console.log(` Assistant "${name}" created successfully!`);
            window.location.href = `/assistant-editor.html?name=${encodeURIComponent(name)}&template=${this.selectedTemplate || 'blank'}`;
        }, 1500);
    }
    
    public closeModal(): void {
        document.getElementById('createModal')?.classList.remove('show');
        const successMsg = document.getElementById('successMessage');
        if (successMsg) successMsg.style.display = 'none';
    }
    
    private handleOutsideClick(e: Event): void {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('userDropdown');
        if (userMenu && dropdown && !userMenu.contains(e.target as Node)) {
            dropdown.style.display = 'none';
        }
    }
    
    private loadSavedAssistants(): void {
        try {
            const savedAssistants: Assistant[] = JSON.parse(localStorage.getItem('voicepartnerai_assistants') || '[]');
            const grid = document.getElementById('savedAssistantsGrid');
            const emptyState = document.getElementById('emptyAssistantsState');
            
            console.log('=Ë Loading saved assistants:', savedAssistants.length);
            
            if (!grid || !emptyState) return;
            
            if (savedAssistants.length === 0) {
                grid.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }
            
            grid.style.display = 'grid';
            emptyState.style.display = 'none';
            grid.innerHTML = '';
            
            savedAssistants.forEach(assistant => {
                const assistantCard = this.createAssistantCard(assistant);
                grid.appendChild(assistantCard);
            });
            
        } catch (error) {
            console.error('L Error loading assistants:', error);
        }
    }
    
    private createAssistantCard(assistant: Assistant): HTMLElement {
        const card = document.createElement('div');
        card.className = 'assistant-card';
        card.onclick = () => this.editAssistant(assistant);
        
        const updatedDate = new Date(assistant.updatedAt).toLocaleDateString();
        
        card.innerHTML = `
            <div class="assistant-card-header">
                <div class="assistant-info">
                    <h3>${assistant.name}</h3>
                    <div class="assistant-id">${assistant.id}</div>
                </div>
                <div class="assistant-status ${assistant.status}">${assistant.status}</div>
            </div>
            
            <div class="assistant-preview">${assistant.firstMessage}</div>
            
            <div class="assistant-meta">
                <div class="assistant-template">${assistant.template}</div>
                <div class="assistant-date">Updated ${updatedDate}</div>
            </div>
            
            <div class="assistant-actions">
                <button class="assistant-action" onclick="event.stopPropagation(); dashboard.editAssistant(assistant)" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="assistant-action" onclick="event.stopPropagation(); dashboard.duplicateAssistant('${assistant.id}')" title="Duplicate">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="assistant-action delete" onclick="event.stopPropagation(); dashboard.deleteAssistant('${assistant.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return card;
    }
    
    public editAssistant(assistant: Assistant): void {
        window.location.href = `/assistant-editor.html?name=${encodeURIComponent(assistant.name)}&template=${assistant.template}&edit=true`;
    }
    
    public duplicateAssistant(assistantId: string): void {
        try {
            const savedAssistants: Assistant[] = JSON.parse(localStorage.getItem('voicepartnerai_assistants') || '[]');
            const original = savedAssistants.find(a => a.id === assistantId);
            
            if (original) {
                const duplicate: Assistant = {
                    ...original,
                    id: 'ast_' + Math.random().toString(36).substr(2, 9),
                    name: original.name + ' (Copy)',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                savedAssistants.push(duplicate);
                localStorage.setItem('voicepartnerai_assistants', JSON.stringify(savedAssistants));
                this.loadSavedAssistants();
                
                console.log(' Assistant duplicated:', duplicate.id);
            }
        } catch (error) {
            console.error('L Error duplicating assistant:', error);
        }
    }
    
    public deleteAssistant(assistantId: string): void {
        if (confirm('Are you sure you want to delete this assistant? This action cannot be undone.')) {
            try {
                let savedAssistants: Assistant[] = JSON.parse(localStorage.getItem('voicepartnerai_assistants') || '[]');
                savedAssistants = savedAssistants.filter(a => a.id !== assistantId);
                localStorage.setItem('voicepartnerai_assistants', JSON.stringify(savedAssistants));
                this.loadSavedAssistants();
                
                console.log('=Ñ Assistant deleted:', assistantId);
            } catch (error) {
                console.error('L Error deleting assistant:', error);
            }
        }
    }
}

// Initialize dashboard
const dashboard = new VoicePartnerAIDashboard();

// Export functions for HTML onclick handlers
(window as any).dashboard = dashboard;
(window as any).showSection = (section: string) => dashboard.showSection(section);
(window as any).openCreateModal = (template?: string) => dashboard.openCreateModal(template);
(window as any).createAssistant = () => dashboard.createAssistant();
(window as any).closeModal = () => dashboard.closeModal();