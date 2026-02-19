import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ClassView } from './components/ClassView';
import { Impressum } from './components/Impressum';

function App() {
  const [showImpressum, setShowImpressum] = useState(false);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar onShowImpressum={() => setShowImpressum(true)} />
      <ClassView />
      {showImpressum && <Impressum onClose={() => setShowImpressum(false)} />}
    </div>
  );
}

export default App;
