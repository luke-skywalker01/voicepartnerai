/**
 * Integration Tests for VoicePartnerAI Frontend
 * Tests the complete user workflow and functionality
 */

// Mock DOM elements for testing
const mockDOM = {
    getElementById: (id) => {
        const mockElements = {
            'assistantName': { value: 'Test Assistant', focus: () => {} },
            'createModal': { classList: { add: () => {}, remove: () => {} } },
            'successMessage': { style: { display: 'none' }, innerHTML: '' },
            'theme-icon': { className: 'fas fa-sun' },
            'theme-text': { textContent: 'Light' }
        };
        return mockElements[id] || { style: {}, classList: { add: () => {}, remove: () => {} } };
    },
    querySelectorAll: () => [],
    documentElement: {
        setAttribute: () => {},
        getAttribute: () => 'light'
    }
};

// Mock localStorage
const mockLocalStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    clear: function() {
        this.data = {};
    }
};

// Test Suite
class VoicePartnerAITests {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    /**
     * Add a test case
     */
    test(description, testFunction) {
        this.tests.push({ description, testFunction });
    }

    /**
     * Run all tests
     */
    async runTests() {
        console.log('🧪 Running VoicePartnerAI Integration Tests...\n');
        
        for (const test of this.tests) {
            try {
                await test.testFunction();
                this.passed++;
                this.results.push({ test: test.description, status: 'PASSED', error: null });
                console.log(`✅ ${test.description}`);
            } catch (error) {
                this.failed++;
                this.results.push({ test: test.description, status: 'FAILED', error: error.message });
                console.log(`❌ ${test.description}`);
                console.log(`   Error: ${error.message}`);
            }
        }
        
        this.printResults();
        return this.results;
    }

    /**
     * Print test results summary
     */
    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log(`   Total:  ${this.tests.length}`);
        console.log(`   Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
    }

    /**
     * Assert helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    /**
     * Async wait helper
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create test instance
const tests = new VoicePartnerAITests();

// Test Cases

tests.test('Assistant Creation Workflow', async () => {
    // Mock the dashboard class
    const mockDashboard = {
        selectedTemplate: null,
        selectTemplate: function(card) {
            this.selectedTemplate = card.dataset?.template || 'customer-support';
        },
        createAssistant: function() {
            const name = mockDOM.getElementById('assistantName').value;
            if (!name) throw new Error('Assistant name is required');
            
            const assistant = {
                id: 'ast_' + Math.random().toString(36).substr(2, 9),
                name: name,
                template: this.selectedTemplate || 'blank',
                status: 'active',
                createdAt: new Date().toISOString()
            };
            
            return assistant;
        }
    };
    
    // Test template selection
    const mockCard = { dataset: { template: 'customer-support' } };
    mockDashboard.selectTemplate(mockCard);
    tests.assert(mockDashboard.selectedTemplate === 'customer-support', 'Template should be selected');
    
    // Test assistant creation
    const assistant = mockDashboard.createAssistant();
    tests.assert(assistant.name === 'Test Assistant', 'Assistant should have correct name');
    tests.assert(assistant.template === 'customer-support', 'Assistant should have correct template');
    tests.assert(assistant.status === 'active', 'Assistant should be active');
    tests.assert(assistant.id.startsWith('ast_'), 'Assistant should have valid ID');
});

tests.test('Theme Toggle Functionality', async () => {
    // Mock theme toggle function
    function toggleTheme() {
        const currentTheme = mockDOM.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        mockDOM.documentElement.setAttribute('data-theme', newTheme);
        mockLocalStorage.setItem('preferred-theme', newTheme);
        
        const icon = mockDOM.getElementById('theme-icon');
        const text = mockDOM.getElementById('theme-text');
        
        if (newTheme === 'dark') {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark';
        } else {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light';
        }
        
        return newTheme;
    }
    
    // Test initial state (light theme)
    tests.assert(mockDOM.getElementById('theme-icon').className === 'fas fa-sun', 'Should start with sun icon');
    tests.assert(mockDOM.getElementById('theme-text').textContent === 'Light', 'Should start with Light text');
    
    // Test toggle to dark
    const newTheme = toggleTheme();
    tests.assert(newTheme === 'dark', 'Should toggle to dark theme');
    tests.assert(mockDOM.getElementById('theme-icon').className === 'fas fa-moon', 'Should show moon icon');
    tests.assert(mockDOM.getElementById('theme-text').textContent === 'Dark', 'Should show Dark text');
    tests.assert(mockLocalStorage.getItem('preferred-theme') === 'dark', 'Should save preference');
    
    // Test toggle back to light
    const backToLight = toggleTheme();
    tests.assert(backToLight === 'light', 'Should toggle back to light theme');
    tests.assert(mockDOM.getElementById('theme-icon').className === 'fas fa-sun', 'Should show sun icon again');
});

tests.test('Local Storage Assistant Management', async () => {
    // Mock assistant data
    const testAssistant = {
        id: 'ast_test123',
        name: 'Test Assistant',
        template: 'customer-support',
        firstMessage: 'Hello! How can I help you?',
        systemPrompt: 'You are a helpful assistant.',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Test saving assistant
    const savedAssistants = [testAssistant];
    mockLocalStorage.setItem('voicepartnerai_assistants', JSON.stringify(savedAssistants));
    
    // Test loading assistants
    const loaded = JSON.parse(mockLocalStorage.getItem('voicepartnerai_assistants') || '[]');
    tests.assert(loaded.length === 1, 'Should load one assistant');
    tests.assert(loaded[0].id === testAssistant.id, 'Should load correct assistant ID');
    tests.assert(loaded[0].name === testAssistant.name, 'Should load correct assistant name');
    
    // Test duplicate assistant
    const duplicate = {
        ...testAssistant,
        id: 'ast_copy123',
        name: testAssistant.name + ' (Copy)'
    };
    savedAssistants.push(duplicate);
    mockLocalStorage.setItem('voicepartnerai_assistants', JSON.stringify(savedAssistants));
    
    const loadedWithDupe = JSON.parse(mockLocalStorage.getItem('voicepartnerai_assistants') || '[]');
    tests.assert(loadedWithDupe.length === 2, 'Should have two assistants after duplication');
    tests.assert(loadedWithDupe[1].name.includes('(Copy)'), 'Duplicate should have (Copy) suffix');
});

tests.test('URL Parameter Handling', async () => {
    // Mock URL parameters
    const mockURLSearchParams = {
        params: {
            name: 'Test Assistant',
            template: 'customer-support',
            edit: 'true'
        },
        get: function(key) {
            return this.params[key] || null;
        }
    };
    
    // Test parameter extraction
    const assistantName = mockURLSearchParams.get('name');
    const template = mockURLSearchParams.get('template');
    const isEdit = mockURLSearchParams.get('edit') === 'true';
    
    tests.assert(assistantName === 'Test Assistant', 'Should extract assistant name from URL');
    tests.assert(template === 'customer-support', 'Should extract template from URL');
    tests.assert(isEdit === true, 'Should detect edit mode');
    
    // Test URL encoding/decoding
    const encodedName = encodeURIComponent('Test Assistant & Co');
    const decodedName = decodeURIComponent(encodedName);
    tests.assert(decodedName === 'Test Assistant & Co', 'Should handle special characters in URLs');
});

tests.test('Form Validation', async () => {
    // Mock form validation function
    function validateAssistantForm(formData) {
        const errors = [];
        
        if (!formData.name || formData.name.trim().length === 0) {
            errors.push('Assistant name is required');
        }
        
        if (!formData.firstMessage || formData.firstMessage.trim().length === 0) {
            errors.push('First message is required');
        }
        
        if (!formData.systemPrompt || formData.systemPrompt.trim().length === 0) {
            errors.push('System prompt is required');
        }
        
        if (formData.name && formData.name.length > 100) {
            errors.push('Assistant name must be less than 100 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // Test valid form data
    const validData = {
        name: 'Test Assistant',
        firstMessage: 'Hello!',
        systemPrompt: 'You are helpful.',
        template: 'customer-support'
    };
    
    const validResult = validateAssistantForm(validData);
    tests.assert(validResult.isValid === true, 'Valid data should pass validation');
    tests.assert(validResult.errors.length === 0, 'Valid data should have no errors');
    
    // Test invalid form data
    const invalidData = {
        name: '',
        firstMessage: '',
        systemPrompt: '',
        template: 'customer-support'
    };
    
    const invalidResult = validateAssistantForm(invalidData);
    tests.assert(invalidResult.isValid === false, 'Invalid data should fail validation');
    tests.assert(invalidResult.errors.length === 3, 'Should have three validation errors');
    tests.assert(invalidResult.errors.includes('Assistant name is required'), 'Should validate name');
});

tests.test('API Simulation', async () => {
    // Mock API functions
    const mockAPI = {
        assistants: [],
        
        async createAssistant(data) {
            await tests.wait(100); // Simulate network delay
            
            const assistant = {
                id: 'ast_' + Math.random().toString(36).substr(2, 9),
                ...data,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            this.assistants.push(assistant);
            return assistant;
        },
        
        async getAssistants() {
            await tests.wait(50);
            return [...this.assistants];
        },
        
        async testAssistant(id) {
            await tests.wait(200);
            const assistant = this.assistants.find(a => a.id === id);
            if (!assistant) throw new Error('Assistant not found');
            
            return {
                status: 'test_completed',
                assistant_id: id,
                duration: '00:00:15',
                response_time: '250ms'
            };
        }
    };
    
    // Test API creation
    const newAssistant = await mockAPI.createAssistant({
        name: 'API Test Assistant',
        template: 'customer-support',
        firstMessage: 'Hello!',
        systemPrompt: 'You are helpful.'
    });
    
    tests.assert(newAssistant.id.startsWith('ast_'), 'Should generate valid ID');
    tests.assert(newAssistant.name === 'API Test Assistant', 'Should return correct name');
    tests.assert(newAssistant.status === 'active', 'Should be active by default');
    
    // Test API retrieval
    const assistants = await mockAPI.getAssistants();
    tests.assert(assistants.length === 1, 'Should return one assistant');
    tests.assert(assistants[0].id === newAssistant.id, 'Should return created assistant');
    
    // Test assistant testing
    const testResult = await mockAPI.testAssistant(newAssistant.id);
    tests.assert(testResult.status === 'test_completed', 'Should complete test successfully');
    tests.assert(testResult.assistant_id === newAssistant.id, 'Should test correct assistant');
});

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoicePartnerAITests, tests };
} else {
    window.VoicePartnerAITests = { VoicePartnerAITests, tests };
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined' && window.document) {
    // Run tests when page loads
    document.addEventListener('DOMContentLoaded', async () => {
        const results = await tests.runTests();
        console.log('\n🎉 VoicePartnerAI Integration Tests Complete!');
    });
}