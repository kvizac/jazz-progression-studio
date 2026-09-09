import { Component, StrictMode } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class StartupBoundary extends Component<{children:ReactNode},{error:string|null}> {
  state:{error:string|null}={error:null};
  static getDerivedStateFromError(error:unknown) { return {error:error instanceof Error?error.message:String(error)}; }
  componentDidCatch(error:Error,info:ErrorInfo) { console.error('Studio startup failed',error,info.componentStack); }
  render() {
    if(this.state.error) return <main style={{maxWidth:560,margin:'12vh auto',padding:24}}>
      <h1>Jazz Progression Studio</h1><p style={{margin:'20px 0'}}>The studio could not finish loading. Your saved project has not been deleted.</p>
      <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',padding:16,background:'#22262c'}}>{this.state.error}</pre>
      <button onClick={()=>location.reload()}>Reload</button><p style={{marginTop:16}}>If this continues, send a screenshot of this message. Version 6.0.1.</p>
    </main>;
    return this.props.children;
  }
}
createRoot(document.getElementById('root')!).render(<StrictMode><StartupBoundary><App /></StartupBoundary></StrictMode>);
