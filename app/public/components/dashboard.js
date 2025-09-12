/**
 * VoicePartnerAI Dashboard - Typed JavaScript Module
 * @typedef {Object} Assistant
 * @property {string} id
 * @property {string} name
 * @property {string} firstMessage
 * @property {string} systemPrompt
 * @property {string} model
 * @property {string} voice
 * @property {string} language
 * @property {string} provider
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {'active'|'inactive'} status
 * @property {string} template
 */

class VoicePartnerAIDashboard {
    constructor() {
        /** @type {string|null} */
        this.selectedTemplate = null;
        this.init();
    }
    
    init() {
        console.log('🚀 VoicePartnerAI Dashboard 2.0 - TypeScript-like JavaScript loaded');
        this.setupEventListeners();
        this.loadSavedAssistants();
    }
    
    setupEventListeners() {
        // Template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (event) => {
                this.selectTemplate(/** @type {HTMLElement} */ (event.currentTarget));
            });
        });
        
        // User menu
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });
    }
    
    /**
     * Show a specific section in the dashboard
     * @param {string} section 
     */
    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
        
        // Remove active from all nav items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        // Show selected section
        const targetSection = document.getElementById(section + '-section');
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        console.log(`✅ Switched to ${section} section`);
    }
    
    /**
     * Select a template card
     * @param {HTMLElement} card 
     */
    selectTemplate(card) {
        // Remove selection from all cards
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
        
        // Select this card
        card.classList.add('selected');
        this.selectedTemplate = card.dataset.template || null;
        
        console.log(`✅ Selected template: ${this.selectedTemplate}`);
        
        // Auto-open create modal after selection
        setTimeout(() => {
            this.openCreateModal(this.selectedTemplate);
        }, 300);
    }
    
    /**
     * Open the create assistant modal
     * @param {string|null} template 
     */
    openCreateModal(template = null) {
        const modal = document.getElementById('createModal');
        const nameInput = /** @type {HTMLInputElement} */ (document.getElementById('assistantName'));
        
        if (template && nameInput) {
            this.selectedTemplate = template;
            /** @type {Record<string, string>} */
            const templateNames = {
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
        
        console.log(`✅ Opened create modal for template: ${template || 'none'}`);
    }
    
    /**
     * Create a new assistant
     */
    createAssistant() {
        const nameInput = /** @type {HTMLInputElement} */ (document.getElementById('assistantName'));
        const name = nameInput?.value || 'Untitled Assistant';
        
        console.log('🚀 Creating assistant...', { name, template: this.selectedTemplate });
        
        // Show success message
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.style.display = 'block';
            successMsg.innerHTML = `<i class="fas fa-check-circle"></i> Assistant "${name}" created successfully with ${this.selectedTemplate || 'blank'} template!`;
        }
        
        // Close modal and redirect to assistant editor
        setTimeout(() => {
            this.closeModal();
            console.log(`✅ Assistant "${name}" created successfully!`);
            window.location.href = `/pages/assistant-editor.html?name=${encodeURIComponent(name)}&template=${this.selectedTemplate || 'blank'}`;
        }, 1500);
    }
    
    /**
     * Close the create modal
     */
    closeModal() {
        document.getElementById('createModal')?.classList.remove('show');
        const successMsg = document.getElementById('successMessage');
        if (successMsg) successMsg.style.display = 'none';
    }
    
    /**
     * Handle clicks outside the user menu
     * @param {Event} e 
     */
    handleOutsideClick(e) {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('userDropdown');
        if (userMenu && dropdown && !userMenu.contains(/** @type {Node} */ (e.target))) {
            dropdown.style.display = 'none';
        }
    }
    
    /**
     * Load saved assistants from localStorage
     */
    loadSavedAssistants() {
        try {
            /** @type {Assistant[]} */
            const savedAssistants = JSON.parse(localStorage.getItem('voicepartnerai_assistants') || '[]');
            const grid = document.getElementById('savedAssistantsGrid');
            const emptyState = document.getElementById('emptyAssistantsState');
            
            console.log('📋 Loading saved assistants:', savedAssistants.length);
            
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
            console.error('❌ Error loading assistants:', error);
        }
    }
    
    /**
     * Create an assistant card element
     * @param {Assistant} assistant 
     * @returns {HTMLElement}
     */
    createAssistantCard(assistant) {
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
                <button class="assistant-action" onclick="event.stopPropagation(); dashboard.editAssistant(${JSON.stringify(assistant).replace(/"/g, '&quot;')})" title="Edit">
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
    
    /**
     * Edit an existing assistant
     * @param {Assistant} assistant 
     */
    editAssistant(assistant) {
        window.location.href = `/pages/assistant-editor.html?name=${encodeURIComponent(assistant.name)}&template=${assistant.template}&edit=true`;
    }
    
    /**
     * Duplicate an assistant
     * @param {string} assistantId 
     */
    duplicateAssistant(assistantId) {
        try {
            /** @type {Assistant[]} */
            const savedAssistants = JSON.parse(localStorage.getItem('voicepartnerai_assistants') || '[]');
            const original = savedAssistants.find(a => a.id === assistantId);
            
            if (original) {
                /** @type {Assistant} */
                const duplicate = {
                    ...original,
                    id: 'ast_' + Math.random().toString(36).substr(2, 9),
                    name: original.name + ' (Copy)',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                savedAssistants.push(duplicate);
                localStorage.setItem('voicepartnerai_assistants', JSON.stringify(savedAssistants));
                this.loadSavedAssistants();
                
                console.log('✅ Assistant duplicated:', duplicate.id);
            }
        } catch (error) {
            console.error('❌ Error duplicating assistant:', error);
        }
    }
    
    /**
     * Delete an assistant
     * @param {string} assistantId 
     */
    deleteAssistant(assistantId) {
        if (confirm('Are you sure you want to delete this assistant? This action cannot be undone.')) {
            try {
                /** @type {Assistant[]} */
                let savedAssistants = JSON.parse(localStorage.getItem('voicepartnerai_assistants') || '[]');
                savedAssistants = savedAssistants.filter(a => a.id !== assistantId);
                localStorage.setItem('voicepartnerai_assistants', JSON.stringify(savedAssistants));
                this.loadSavedAssistants();
                
                console.log('🗑️ Assistant deleted:', assistantId);
            } catch (error) {
                console.error('❌ Error deleting assistant:', error);
            }
        }
    }
    
    /**
     * Refresh assistants list
     */
    refreshAssistants() {
        this.loadSavedAssistants();
        console.log('🔄 Assistants refreshed');
    }
}

// Initialize dashboard
const dashboard = new VoicePartnerAIDashboard();

// Export functions for HTML onclick handlers
window.dashboard = dashboard;
window.showSection = (section) => dashboard.showSection(section);
window.openCreateModal = (template) => dashboard.openCreateModal(template);
window.createAssistant = () => dashboard.createAssistant();
window.closeModal = () => dashboard.closeModal();
window.refreshAssistants = () => dashboard.refreshAssistants();

// Additional functions needed by HTML onclick handlers
window.filterTemplates = (category) => {
    const cards = document.querySelectorAll('.template-card');
    const tabs = document.querySelectorAll('.category-tab');
    
    // Update active tab
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter cards
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    console.log(`✅ Filtered templates: ${category}`);
};

window.createWorkflow = () => {
    console.log('🚀 Creating new workflow...');
    const modal = document.getElementById('workflowModal');
    modal?.classList.add('show');
    document.getElementById('workflowName')?.focus();
};

window.closeWorkflowModal = () => {
    document.getElementById('workflowModal')?.classList.remove('show');
    const successMsg = document.getElementById('workflowSuccessMessage');
    if (successMsg) successMsg.style.display = 'none';
};

window.createNewWorkflow = () => {
    const nameInput = document.getElementById('workflowName');
    const name = nameInput?.value || 'Untitled Workflow';
    const template = document.querySelector('input[name="workflowTemplate"]:checked')?.value || 'blank';
    
    console.log('🚀 Creating workflow...', { name, template });
    
    // Show success message
    const successMsg = document.getElementById('workflowSuccessMessage');
    if (successMsg) {
        successMsg.style.display = 'block';
        successMsg.innerHTML = `<i class="fas fa-check-circle"></i> Workflow "${name}" created successfully with ${template} template!`;
    }
    
    // Close modal and redirect to workflow editor
    setTimeout(() => {
        window.closeWorkflowModal();
        console.log(`✅ Workflow "${name}" created successfully!`);
        window.location.href = `/workflow-editor.html?name=${encodeURIComponent(name)}&template=${template}`;
    }, 1500);
};

window.toggleUserMenu = () => {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
};

window.logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('voicepartnerai_session');
    sessionStorage.removeItem('voicepartnerai_session');
    window.location.href = '/pages/login.html';
};

// Initialize additional event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Dropdown item hover effects
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = 'var(--bg-tertiary)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            dashboard.openCreateModal();
        }
        if (e.key === 'Escape') {
            dashboard.closeModal();
            window.closeWorkflowModal();
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.style.display = 'none';
        }
    });
});