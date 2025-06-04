import { useEffect, useState } from 'react';

export default function PromoList({ user }) {
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    fetch('/api/promocoes', {
      headers: { Authorization: `Bearer ${user && user.accessToken}` }
    })
      .then(res => res.json())
      .then(setPromos);
  }, [user]);

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Promoções Ativas</h2>
      <ul>
        {promos.map(promo => (
          <li key={promo.id} className="mb-2 border-b pb-2">
            <span className="font-bold">{promo.nome}</span> — {promo.codigo} <br />
            <span className="text-sm text-gray-500">De {promo.inicio} até {promo.fim}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 
