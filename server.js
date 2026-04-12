import app from './api/index.js';

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Backend securely listening on http://localhost:${port}`);
});
