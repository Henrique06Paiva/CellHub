export const mockNetworks = [
  { id: 1, name: "Rede Jovem", disciplerId: 3 },
  { id: 2, name: "Rede Famílias", disciplerId: null }
];

export const mockCells = [
  { id: 101, name: "Célula Betel", networkId: 1, leaderId: 2, address: "Rua das Flores, 123 - Centro" },
  { id: 102, name: "Célula Peniel", networkId: 1, leaderId: null, address: "Av. Brasil, 456 - Bairro X" },
  { id: 103, name: "Célula Koinonia", networkId: 2, leaderId: null, address: "Rua Y, 789 - Bairro Z" }
];

export const mockUsers = [
  // Discipler user
  { id: 3, name: "Carlos Discipulador", role: "discipler", networkId: 1, cellId: null, email: "carlos@rede.com", password: "123" },
  // Leader user
  { id: 2, name: "Ana Líder", role: "leader", networkId: 1, cellId: 101, email: "ana@celula.com", password: "123" },
  // Member users
  { id: 1, name: "João Membro", role: "member", networkId: 1, cellId: 101, email: "joao@email.com", password: "123" },
  { id: 4, name: "Maria Membro", role: "member", networkId: 1, cellId: 101, email: "maria@email.com", password: "123" },
  { id: 5, name: "Pedro Membro", role: "member", networkId: 1, cellId: 102, email: "pedro@email.com", password: "123" }
];

export const mockAttendances = [
  { id: 1001, cellId: 101, date: "2026-03-20", presentMembers: [1, 4], notes: "Reunião abençoada. Visitantes: 2" }
];
