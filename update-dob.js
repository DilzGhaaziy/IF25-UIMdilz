export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nim, newDob, classType } = req.body;
  const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN; // Kita set ini nanti di Vercel
  const REPO_OWNER = 'USERNAME_GITHUB_KAMU'; // Ganti dengan username GitHub kamu
  const REPO_NAME = 'NAMA_REPO_KAMU'; // Ganti dengan nama repository
  const FILE_PATH = 'data.json';

  try {
    // 1. Ambil data JSON lama dari GitHub
    const fileResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    
    if (!fileResponse.ok) throw new Error('Gagal ambil data');
    
    const fileData = await fileResponse.json();
    const sha = fileData.sha;
    // Decode base64 content
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const json = JSON.parse(content);

    // 2. Cari Mahasiswa dan Update Tanggal Lahir
    const studentIndex = json[classType].findIndex(s => s.nim === nim);
    if (studentIndex === -1) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });

    json[classType][studentIndex].dob = newDob;

    // 3. Simpan balik ke GitHub (Commit baru)
    const newContent = Buffer.from(JSON.stringify(json, null, 2)).toString('base64');

    const updateResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update DOB for NIM ${nim}`,
        content: newContent,
        sha: sha
      })
    });

    if (!updateResponse.ok) throw new Error('Gagal update ke GitHub');

    return res.status(200).json({ success: true, message: 'Data tersimpan! Tunggu 1-2 menit untuk update.' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}