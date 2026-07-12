import MainApp from '@/components/MainApp';

export default function Home() {
  return (
    <div style={{ 
      width: '100%', 
      height: '100dvh', 
      overflow: 'hidden', 
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="app-layout">
        <MainApp />
      </div>
    </div>
  );
}
