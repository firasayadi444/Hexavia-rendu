import { challenge } from '../config/challenge';
import { WorkspaceApp } from './workspace-app';

export default function Page() {
  return <main className="container">
    <header className="topbar no-print">
      <a className="brand" href="/">élan<span>.</span></a>
      <span>CHALLENGE INNOVATION · {challenge.clientName.toUpperCase()}</span>
    </header>
    <WorkspaceApp />
    <footer className="no-print">ÉLAN · DE L’IDÉE À L’ACTION</footer>
  </main>;
}
