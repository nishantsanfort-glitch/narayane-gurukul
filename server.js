const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Dual-mode Database Initialization (SQLite with JSON File fallback)
let dbType = 'JSON';
let dbInstance = null;
const JSON_DB_PATH = path.join(__dirname, 'database.json');
const SQLITE_DB_PATH = path.join(__dirname, 'database.db');

try {
    // Attempt to load sqlite3
    const sqlite3 = require('sqlite3').verbose();
    dbInstance = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
        if (err) {
            console.error('Failed to open SQLite database, falling back to JSON storage:', err.message);
            initJsonDb();
        } else {
            console.log('Connected to the SQLite database.');
            dbType = 'SQLite';
            dbInstance.run(`
                CREATE TABLE IF NOT EXISTS inquiries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    name TEXT NOT NULL,
                    parentName TEXT,
                    phone TEXT NOT NULL,
                    classStage TEXT,
                    investmentRange TEXT,
                    createdAt TEXT NOT NULL
                )
            `);
        }
    });
} catch (e) {
    console.log('sqlite3 npm package not found or failed to compile. Using fail-safe JSON File database.');
    initJsonDb();
}

function initJsonDb() {
    dbType = 'JSON';
    if (!fs.existsSync(JSON_DB_PATH)) {
        fs.writeFileSync(JSON_DB_PATH, JSON.stringify([], null, 2));
    }
    console.log('JSON File-Based database initialized successfully.');
}

// Helper functions for JSON database operations
function getJsonInquiries() {
    try {
        const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveJsonInquiries(inquiries) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(inquiries, null, 2));
}

// API Endpoints

// 1. Get Server & Database Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        database: dbType,
        timestamp: new Date().toISOString()
    });
});

// 2. Submit a New Inquiry (Admission or Franchise)
app.post('/api/inquiries', (req, res) => {
    const { type, name, parentName, phone, classStage, investmentRange } = req.body;

    if (!type || !name || !phone) {
        return res.status(400).json({ error: 'Type, Name, and Phone are required fields.' });
    }

    const newInquiry = {
        type,
        name,
        parentName: parentName || null,
        phone,
        classStage: classStage || null,
        investmentRange: investmentRange || null,
        createdAt: new Date().toISOString()
    };

    if (dbType === 'SQLite' && dbInstance) {
        const query = `
            INSERT INTO inquiries (type, name, parentName, phone, classStage, investmentRange, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        dbInstance.run(query, [
            newInquiry.type,
            newInquiry.name,
            newInquiry.parentName,
            newInquiry.phone,
            newInquiry.classStage,
            newInquiry.investmentRange,
            newInquiry.createdAt
        ], function(err) {
            if (err) {
                console.error('SQLite insert error:', err.message);
                return res.status(500).json({ error: 'Failed to write to SQLite database.' });
            }
            res.status(201).json({
                message: 'Inquiry saved successfully to SQLite database!',
                id: this.lastID,
                data: newInquiry
            });
        });
    } else {
        // Fallback JSON DB
        const inquiries = getJsonInquiries();
        const id = inquiries.length > 0 ? inquiries[inquiries.length - 1].id + 1 : 1;
        const entry = { id, ...newInquiry };
        inquiries.push(entry);
        saveJsonInquiries(inquiries);

        res.status(201).json({
            message: 'Inquiry saved successfully to JSON File database!',
            id: id,
            data: entry
        });
    }
});

// 3. Get All Inquiries
app.get('/api/inquiries', (req, res) => {
    if (dbType === 'SQLite' && dbInstance) {
        dbInstance.all('SELECT * FROM inquiries ORDER BY id DESC', [], (err, rows) => {
            if (err) {
                console.error('SQLite read error:', err.message);
                return res.status(500).json({ error: 'Failed to fetch inquiries.' });
            }
            res.json(rows);
        });
    } else {
        // Fallback JSON DB
        const inquiries = getJsonInquiries();
        // Sort descending by ID to match database query
        res.json([...inquiries].reverse());
    }
});

// 4. Delete an Inquiry
app.delete('/api/inquiries/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (dbType === 'SQLite' && dbInstance) {
        dbInstance.run('DELETE FROM inquiries WHERE id = ?', id, function(err) {
            if (err) {
                console.error('SQLite delete error:', err.message);
                return res.status(500).json({ error: 'Failed to delete inquiry.' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Inquiry not found.' });
            }
            res.json({ message: `Inquiry #${id} deleted successfully from SQLite database!` });
        });
    } else {
        // Fallback JSON DB
        const inquiries = getJsonInquiries();
        const initialLength = inquiries.length;
        const filtered = inquiries.filter(item => item.id !== id);

        if (filtered.length === initialLength) {
            return res.status(404).json({ error: 'Inquiry not found.' });
        }

        saveJsonInquiries(filtered);
        res.json({ message: `Inquiry #${id} deleted successfully from JSON File database!` });
    }
});

// 5. Smart AI Guru Chatbot API
app.post('/api/chat', (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message field is required.' });
    }

    const query = message.toLowerCase().trim();
    let reply = "";
    let suggestions = [];

    // Helper keyword matching
    if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('greetings')) {
        reply = "Hello! I am **AI Guru**, your virtual academic mentor. 🎓 I am here to help you navigate study materials, batches, admissions, and more at Narayan e-Gurukul. What are you looking to excel in today?";
        suggestions = ["Explore Study Material", "Ask About JEE Prep", "Sanfort Pre-School Inquiry", "Tell me about NEET"];
    } 
    else if (query.includes('launch') || query.includes('when') || query.includes('date') || query.includes('toolkit') || query.includes('august')) {
        reply = "New study material and learning paths are coming soon! 🚀 You can join our notification list in the 'Stay Updated' section or use the contact form to stay informed.";
        suggestions = ["How to join notification list?", "Explore Study Material", "Ask about NEET prep"];
    }
    else if (query.includes('waitlist') || query.includes('join') || query.includes('sign up') || query.includes('notify')) {
        reply = "Great choice! 🌟 To join our priority notification list, scroll down to the **'Stay Updated'** section in our page footer or fill out the **Contact Form** on our home page. We'll notify you when the next resources are published!";
        suggestions = ["Scroll to Footer", "Go to Contact Form", "What study notes do you have?"];
    }
    else if (query.includes('material') || query.includes('note') || query.includes('pyq') || query.includes('book') || query.includes('study') || query.includes('paper') || query.includes('viva')) {
        reply = "Narayan e-Gurukul provides a **100% Free** academic repository! 📚 You'll get high-quality notes, solved PYQs (Previous Year Questions), interactive concept maps, and lab manuals optimized to help you score higher in your exams.";
        suggestions = ["Explore Our Batches", "Download Mobile App", "Ask About JEE Prep"];
    }
    else if (query.includes('batch') || query.includes('course') || query.includes('branch') || query.includes('specialization') || query.includes('cse') || query.includes('aiml') || query.includes('aids') || query.includes('core')) {
        reply = "We offer focused study tracks for JEE, NEET, school competitions, and computer science skills. Explore the 'Our Batch' page or contact us for guidance on the best resources.";
        suggestions = ["Tell me about JEE prep", "Tell me about NEET prep", "Explore Batches Page"];
    }
    else if (query.includes('school') || query.includes('preschool') || query.includes('sanfort') || query.includes('admission') || query.includes('franchise') || query.includes('child') || query.includes('inquiry')) {
        reply = "We host a comprehensive admissions and inquiry manager for **Sanfort Pre-School, Hanumangarh**! 🏫 Whether you are looking for Nursery/KG admissions or Franchise opportunities, you can use our dual-tabbed interactive form on the **'My School'** page. All submissions sync directly to our primary SQLite server with zero data loss fallbacks!";
        suggestions = ["Go to My School Page", "How does SQLite database work?", "View Inquiry Dashboard"];
    }
    else if (query.includes('database') || query.includes('sqlite') || query.includes('json') || query.includes('fail-safe') || query.includes('dashboard') || query.includes('admin')) {
        reply = "Narayan e-Gurukul features a **Fail-Safe Triple-Database Engine**! 💾 \n\n" +
                "- **Primary:** SQLite Database (`database.db`) for secure inquiry tracking.\n" +
                "- **Secondary Fallback:** Zero-dependency `database.json` file if SQLite is busy.\n" +
                "- **Tertiary Fallback:** Browser LocalStorage cache (stores inquiries locally if the server is offline, and auto-syncs when online!).\n\n" +
                "Managers can inspect all live records on the secure **Admin Dashboard**!";
        suggestions = ["View Admin Dashboard", "Submit a Test Inquiry", "How to contact support?"];
    }
    else if (query.includes('app') || query.includes('download') || query.includes('android') || query.includes('ios') || query.includes('mobile') || query.includes('play store')) {
        reply = "Yes! The **Narayan e-Gurukul Mobile App** is coming soon to the Google Play Store and Apple App Store! 📱 With the app, you can download lectures, solved question banks, and study guides for 100% offline learning anytime, anywhere.";
        suggestions = ["Ask About JEE Prep", "How to get email notified?", "Go to home page"];
    }
    else if (query.includes('contact') || query.includes('support') || query.includes('email') || query.includes('address') || query.includes('location') || query.includes('help')) {
        reply = "We are always here to support your learning journey! 🤝 \n\n" +
                "📧 **Email:** nishant.sanfort@gmail.com\n" +
                "📍 **Address:** Hanumangarh, Rajasthan, India - 335512\n\n" +
                "You can also send an instant message using our **Contact Form** on the homepage!";
        suggestions = ["Go to Contact Form", "Explore Study Material", "Who built e-Gurukul?"];
    }
    else if (query.includes('author') || query.includes('creator') || query.includes('developer') || query.includes('built') || query.includes('who is nishant') || query.includes('nishant')) {
        reply = "Narayan e-Gurukul was conceived and crafted by **Nishant Saini** and his talented engineering team! 💻 It was developed using a premium tech stack (Outfit Typography, Remix Icons, Express Node Server, and a smart Fail-Safe DB) to empower students across India.";
        suggestions = ["What is the tech stack?", "Send message to Nishant", "Tell me more about the mission"];
    }
    else if (query.includes('thank') || query.includes('thanks') || query.includes('awesome') || query.includes('great') || query.includes('cool')) {
        reply = "You are very welcome! 🌟 Helping students succeed is our ultimate goal. Let me know if you need help with study resources, batches, admissions, or anything else.";
        suggestions = ["Explore Study Materials", "Go to homepage", "Ask About JEE Prep"];
    }
    else {
        // General smart response
        reply = "I appreciate your question! 💡 As **AI Guru**, I recommend exploring our study resources for JEE, NEET, school competitions, and computer science skills. What other questions can I answer for you?";
        suggestions = ["Explore Study Material", "Ask About JEE Prep", "Sanfort Pre-School Admission", "How to contact support?"];
    }

    res.json({
        response: reply,
        suggestions: suggestions,
        timestamp: new Date().toISOString()
    });
});

// Serve frontend home page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Narayan e-Gurukul Backend Server is Running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🗄️  Active Database Engine: ${dbType}`);
    console.log(`====================================================`);
});
