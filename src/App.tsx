import { Sidebar } from './components/Sidebar';
import { ClassView } from './components/ClassView';

function App() {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <ClassView />
    </div>
  );
}

export default App;
