import { useState, useEffect } from 'react';

export default function PromoForm({ user }) {
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [folder, setFolder] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [allProdutos, setAllProdutos] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/produtos', {
      headers: { Authorization: `Bearer ${user && user.accessToken}` }
    })
      .then(res => res.json())
      .then(setAllProdutos);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    const res = await fetch('/api/promocoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user && user.accessToken}` },
      body: JSON.stringify({ nome, codigo, folder, produtos, inicio, fim }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || 'Erro ao criar promoção');
    } else {
      setNome(''); setCodigo(''); setFolder(''); setProdutos([]); setInicio(''); setFim('');
      alert('Promoção criada!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8">
      <div className="mb-4">
        <label className="block font-bold">Nome da promoção</label>
        <input value={nome} onChange={e => setNome(e.target.value)} className="input input-bordered w-full" required />
      </div>
      <div className="mb-4">
        <label className="block font-bold">Código promocional</label>
        <input value={codigo} onChange={e => setCodigo(e.target.value)} className="input input-bordered w-full" required />
      </div>
      <div className="mb-4">
        <label className="block font-bold">Folder</label>
        <input value={folder} onChange={e => setFolder(e.target.value)} className="input input-bordered w-full" required />
      </div>
      <div className="mb-4">
        <label className="block font-bold">Produtos</label>
        <select multiple value={produtos} onChange={e => setProdutos([...e.target.selectedOptions].map(o => o.value))} className="select select-bordered w-full">
          {allProdutos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>
      <div className="mb-4 flex gap-4">
        <div>
          <label className="block font-bold">Início</label>
          <input type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} className="input input-bordered" required />
        </div>
        <div>
          <label className="block font-bold">Fim</label>
          <input type="datetime-local" value={fim} onChange={e => setFim(e.target.value)} className="input input-bordered" required />
        </div>
      </div>
      {erro && <div className="text-red-500 mb-2">{erro}</div>}
      <button type="submit" className="btn btn-primary">Criar Promoção</button>
    </form>
  );
} 
