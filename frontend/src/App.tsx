import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UploadPage } from './components/UploadPage';
import { DownloadPage } from './components/DownloadPage';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/d/:slug" element={<DownloadPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;