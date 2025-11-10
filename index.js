const express = require('express');
const admin = require('firebase-admin');

const fs = require('fs');
const serviceAccount = JSON.parse(
  fs.readFileSync('/etc/secrets/serviceAccountKey.json', 'utf8')
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});


const db = admin.firestore();

const app = express();
app.use(express.json());

app.get('/profile/:username', async (req, res) => {
  const username = req.params.username;

  try {
    let doc = null;

    const userSnap = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!userSnap.empty) {
      doc = userSnap.docs[0];
    } else {
      const mentorSnap = await db.collection('mentors')
        .where('username', '==', username)
        .limit(1)
        .get();

      if (!mentorSnap.empty) {
        doc = mentorSnap.docs[0];
      }
    }

    if (!doc) {
      res.status(404).send('Portfolio not found');
      return;
    }

    const data = doc.data();
    const portfolio = data.portfolio;
    if (!portfolio) {
      res.status(404).send('No portfolio data');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>${username}'s Portfolio</title>
          <style>${portfolio.css || ''}</style>
        </head>
        <body>
          ${portfolio.html || ''}
          <script>${portfolio.js || ''}</script>
        </body>
      </html>
    `;

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).send('Internal server error');
  }
});

// Root path optionally
app.get('/', (req, res) => {
  res.send('CodeFusion Portfolio API — use /profile/:username');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
