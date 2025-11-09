const express = require('express');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

const app = express();

// To parse JSON in request body if needed
app.use(express.json());

app.get('/profile/:username', async (req, res) => {
  const username = req.params.username;

  try {
    // Search in users collection
    let userSnap = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    let doc;
    if (!userSnap.empty) {
      doc = userSnap.docs[0];
    } else {
      // Search in mentors collection
      let mentorSnap = await db.collection('mentors')
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

// Use PORT from environment (required for Render) else default 10000
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
