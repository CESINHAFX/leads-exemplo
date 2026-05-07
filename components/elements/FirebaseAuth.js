const FirebaseAuth = () => {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-700">
      <p className="font-semibold">Autenticacao temporariamente simplificada</p>
      <p className="mt-2">
        O componente FirebaseUI legado foi removido do fluxo principal para evitar
        dependencias duplicadas e quebradas. Se quiser, posso implementar login
        com Firebase modular (v9+) neste componente.
      </p>
    </div>
  );
};

export default FirebaseAuth;