import { ImportForm } from './import-form';
export default function Page() {
  return <main className="container">
    <header className="topbar"><a className="brand" href="/">élan<span>.</span></a><span>CHALLENGE INNOVATION · HEXAVIA</span></header>
    <section className="intro"><p className="eyebrow">01 / PRÉPARER LES IDÉES</p><h1>Tout commence par vos idées.</h1><p>Vérifiez le fichier de votre challenge et repérez les informations à compléter.</p></section>
    <ImportForm /><footer>ÉLAN · DE L’IDÉE À L’ACTION</footer>
  </main>;
}
