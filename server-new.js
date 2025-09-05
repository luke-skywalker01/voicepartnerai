const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3006;

// Middleware
app.use(cors());
app.use(express.json());
// STATIC FILES AUSKOMMENTIERT damit nur unsere Route funktioniert
// app.use(express.static(__dirname));

// EINZIGE Route - EXAKTE Vapi Layout basierend auf Screenshot
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'vapi-exact-layout.html'));
});

// API Endpoints für Vapi-Funktionalität
app.post('/api/assistants', (req, res) => {
    const { name, template, config } = req.body;
    
    console.log('✅ Assistant erstellt:', { name, template, config });
    
    res.json({
        success: true,
        id: `assistant_${Date.now()}`,
        name: name || 'Untitled Assistant',
        template,
        config,
        status: 'active',
        createdAt: new Date().toISOString(),
        message: 'Assistant erfolgreich erstellt!'
    });
});

app.get('/api/assistants', (req, res) => {
    res.json({
        assistants: [
            {
                id: 'assistant_1',
                name: 'Customer Service Bot',
                template: 'customer-support',
                status: 'active',
                createdAt: new Date().toISOString()
            }
        ]
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'Vapi Working Replica aktiv!',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Server starten
app.listen(PORT, () => {
    console.clear();
    console.log('\n🎯 VAPI EXACT LAYOUT - SCREENSHOT-BASIERTE REPLICA!');
    console.log('='.repeat(60));
    console.log(`🚀 Server läuft auf: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(60));
    console.log('\n✅ EXAKTE SCREENSHOT-NACHBILDUNG:');
    console.log('   🎨 Dunkles Theme (#1a1a1a) - Pixel-perfect');
    console.log('   📱 Exact Header mit Tabs (Assistants, Docs)');
    console.log('   👤 Assistant-Titel "Emma" mit ID wie im Screenshot'); 
    console.log('   🔵 Teal-Buttons und exakte Farben (#14b8a6)');
    console.log('   📋 Linke Sidebar mit Assistant-Liste');
    console.log('   ⚙️ 7 Config-Tabs (Model, Voice, Transcriber, Tools, etc.)');
    console.log('   🟢 Status-Dots: vapi, deepgram, gpt 4o mini, elevenlabs');
    console.log('   📊 Cost/Latency Metriken mit Farbbalken');
    console.log('\n🎯 ÖFFNEN SIE: http://localhost:3006');
    console.log('   EXAKTE NACHBILDUNG DES VAPI-SCREENSHOTS!');
    console.log('\n🔥 SCREENSHOT-FEATURES IMPLEMENTIERT:');
    console.log('   📝 "Emma" Assistant aktiv wie im Screenshot'); 
    console.log('   🏢 "Momentum Solutions" Systempromt wie original');
    console.log('   🎛️ Exact Model-Konfiguration Panel');
    console.log('   📞 "Talk to Assistant" Button funktional');
    console.log('   🔧 Generate-Button für System Prompt');
    console.log('   📱 8 Assistant-Items in Sidebar');
    console.log('   🌐 "Web" Mode-Indikator rechts oben');
    console.log('\n🎯 SAUBERES INTERFACE: Keine Auto-Tests, pure Vapi-Experience!');
    console.log('='.repeat(60));
});

// Error Handling
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});