import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Network, TrendingUp, Home, Users, AlertTriangle, Map as MapIcon } from 'lucide-react';
import { fetchNetworks, fetchNetworkById } from '../../services/networkService';
import { fetchCells } from '../../services/cellService';
import { fetchUserById, fetchUsers } from '../../services/userService';
import { fetchReports } from '../../services/reportService';
import { Box, VStack, HStack, Text, KPI, Card } from '../../components/core';
import CellMap from '../../components/Discipler/CellMap';
import LoadingFallback from '../../components/Common/LoadingFallback';
import ErrorBoundary from '../../components/Common/ErrorBoundary';

const NetworkView = () => {
  const { currentUser, userData } = useAuth();
  
  const [myNetwork, setMyNetwork] = useState(null);
  const [cells, setCells] = useState([]);
  const [leaders, setLeaders] = useState({});
  const [cellsMembersCount, setCellsMembersCount] = useState({});
  const [lowAttendanceSummary, setLowAttendanceSummary] = useState({});
  const [growthData, setGrowthData] = useState({ count: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNetworkDataCombined = async () => {
      try {
        let networkData = null;
        
        if (userData?.networkId) {
          networkData = await fetchNetworkById(userData.networkId);
        } else if (currentUser?.uid) {
          const networks = await fetchNetworks({ disciplerId: currentUser.uid });
          if (networks.length > 0) networkData = networks[0];
        }

        if (networkData) {
          setMyNetwork(networkData);

          // 1. Fetch Cells
          const loadedCells = await fetchCells({ networkId: networkData.id });
          setCells(loadedCells);

          // 2. Fetch All Members of the Network to calculate Growth
          const allNetworkUsers = await fetchUsers({ networkId: networkData.id });
          
          const now = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);

          let newMembersCount = 0;
          allNetworkUsers.forEach(user => {
            if (user.createdAt) {
              const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
              if (createdDate >= thirtyDaysAgo) {
                newMembersCount++;
              }
            }
          });

          const totalMembersCount = allNetworkUsers.length;
          const oldMembersCount = totalMembersCount - newMembersCount;
          const growthPct = oldMembersCount > 0 ? Math.round((newMembersCount / oldMembersCount) * 100) : (newMembersCount > 0 ? 100 : 0);

          setGrowthData({
            count: newMembersCount,
            percentage: growthPct
          });

          // 3. Process Cell Details (Leaders & Member Counts per cell)
          const lMap = {};
          const cMap = {};
          
          for (const cell of loadedCells) {
            if (cell.leaderId) {
              const leaderData = await fetchUserById(cell.leaderId);
              if (leaderData) lMap[cell.leaderId] = leaderData;
            }
            // Count members per cell
            const cellMembers = allNetworkUsers.filter(u => u.cellId === cell.id);
            cMap[cell.id] = cellMembers.length;
          }
          setLeaders(lMap);
          setCellsMembersCount(cMap);

          // 4. Calculate low attendance summary
          const lowAttSum = {};
          const reports = await fetchReports(userData, { networkId: networkData.id });
          const recentReportsAll = reports.slice(0, 100);

          for (const cell of loadedCells) {
            const cellReports = recentReportsAll.filter(r => r.cellId === cell.id).slice(0, 4);
            if (cellReports.length === 0) continue;

            const cellMembers = allNetworkUsers.filter(u => u.cellId === cell.id);
            let countLow = 0;

            for (const member of cellMembers) {
              const attendedCount = cellReports.filter(r => 
                r.members?.some(m => m.uid === (member.id || member.uid) && m.present)
              ).length;
              const pct = Math.round((attendedCount / cellReports.length) * 100);
              if (pct < 50) {
                countLow++;
              }
            }
            if (countLow > 0) {
              lowAttSum[cell.id] = { cellName: cell.name, count: countLow };
            }
          }
          setLowAttendanceSummary(lowAttSum);
        } else {
          console.warn("[NetworkView] Nenhuma rede encontrada para o usuário.");
        }
      } catch (err) {
        console.error("[NetworkView] Erro crítico ao carregar dados da rede:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      loadNetworkDataCombined();
    } else if (loading) {
      // Se não houver usuário e estiver carregando, damos um timeout para evitar loading infinito
      const timeout = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [currentUser, userData]);

  if (loading) return <LoadingFallback />;
  
  if (!myNetwork) {
    return (
      <Box p="xl" textAlign="center">
        <Text color="textMuted">Você não possui nenhuma rede vinculada ou os dados não foram encontrados.</Text>
      </Box>
    );
  }

  const totalMembers = Object.values(cellsMembersCount).reduce((acc, curr) => acc + curr, 0);

  return (
    <VStack gap="xl" pb="xxl">
      {/* Header */}
      <Box>
        <HStack gap="md" mb="xs">
          <Network size={36} color="var(--primary-color)" />
          <Text size="3xl" weight="800">Visão da Rede</Text>
        </HStack>
        <Text color="textMuted">Acompanhamento estratégico e geográfico da {myNetwork.name}</Text>
      </Box>

      {/* KPI Section */}
      <Box display="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <KPI 
          label="Total de Células" 
          value={cells.length} 
          icon={Home} 
          color="primary" 
        />
        <KPI 
          label="Total de Membros" 
          value={totalMembers} 
          icon={Users} 
          color="success" 
          secondaryInfo="Membros ativos na rede"
        />
        <KPI 
          label="Crescimento (30D)" 
          value={`+${growthData.count}`} 
          icon={TrendingUp} 
          color="warning" 
          trend={growthData.percentage}
          secondaryInfo="Novos membros nos últimos 30 dias"
        />
      </Box>

      {/* Map Section */}
      <Box>
        <HStack gap="sm" mb="md">
          <MapIcon size={20} color="var(--primary-color)" />
          <Text size="lg" weight="700">Geolocalização das Células</Text>
        </HStack>
        <ErrorBoundary fallback={
          <Box height="400px" bg="surface" display="flex" alignItems="center" justifyContent="center" borderRadius="lg" border>
            <Text color="danger">Ocorreu um erro ao carregar o mapa interativo.</Text>
          </Box>
        }>
          <CellMap cells={cells} />
        </ErrorBoundary>
      </Box>

      {/* Alerts Section */}
      {Object.keys(lowAttendanceSummary).length > 0 && (
        <Card bg="danger" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <HStack gap="md" alignItems="flex-start">
            <Box p="sm" borderRadius="md" bg="rgba(239, 68, 68, 0.15)" style={{ color: 'var(--danger-color)' }}>
              <AlertTriangle size={24} />
            </Box>
            <VStack flex="1" gap="sm">
              <VStack gap="xs">
                <Text weight="700" size="lg">Alertas de Baixa Frequência</Text>
                <Text size="sm" color="textMuted">
                  Identificamos membros com menos de 50% de presença. Recomenda-se atenção especial:
                </Text>
              </VStack>
              <HStack gap="sm" style={{ flexWrap: 'wrap' }}>
                {Object.entries(lowAttendanceSummary).map(([cellId, data]) => (
                  <Box 
                    key={cellId} 
                    p="xs" px="md"
                    borderRadius="md" 
                    bg="surface" 
                    border 
                    display="flex" 
                    alignItems="center" 
                    gap="sm"
                  >
                    <Text weight="700" color="primaryLight" size="sm" style={{ whiteSpace: 'nowrap' }}>{data.cellName}</Text>
                    <Box width="1px" height="12px" bg="border" />
                    <Text size="xs" color="danger" weight="700" style={{ whiteSpace: 'nowrap' }}>
                      {data.count} em risco
                    </Text>
                  </Box>
                ))}
              </HStack>
            </VStack>
          </HStack>
        </Card>
      )}

      {/* Detailed Table Section */}
      <Card p="none" style={{ overflow: 'hidden' }}>
        <Box p="lg" borderBottom>
          <Text size="lg" weight="700">Detalhamento das Células</Text>
        </Box>
        
        {cells.length > 0 ? (
          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Célula</th>
                  <th>Líder</th>
                  <th>Endereço / CEP</th>
                  <th>Membros</th>
                </tr>
              </thead>
              <tbody>
                {cells.map(cell => {
                  const leader = leaders[cell.leaderId];
                  return (
                    <tr key={cell.id}>
                      <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{cell.name}</td>
                      <td>
                        {leader ? (
                           <Text size="sm">{leader.name}</Text>
                        ) : (
                          <Text size="xs" color="danger" weight="600">Sem Líder</Text>
                        )}
                      </td>
                      <td>
                        <VStack gap="none">
                          <Text size="sm">{cell.address || 'Sem endereço'}</Text>
                          {cell.cep && <Text size="xs" color="textMuted">CEP: {cell.cep}</Text>}
                        </VStack>
                      </td>
                      <td>
                        <Text weight="700">{cellsMembersCount[cell.id] || 0}</Text>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Box p="xl" textAlign="center">
            <Text color="textMuted">Nenhuma célula associada a esta rede encontrada.</Text>
          </Box>
        )}
      </Card>
    </VStack>
  );
};

export default NetworkView;
