import React, { useContext, useMemo } from 'react';
import { Card, CardHeader, CardContent, Badge, Button } from '../ui';
import { DataContext } from '../../hooks/DataContext';
import { Client, PaymentFrequency, PaymentStatus } from '../../types';
import { ArrowRight, DollarSign, UserCheck, UserX, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { View } from '../../App';

const getClientPaymentStatus = (client: Client, today: Date): PaymentStatus => {
    const nextPaymentDate = new Date(client.nextPaymentDate);
    if (nextPaymentDate < today) {
        return PaymentStatus.Overdue;
    }
    const daysUntilPayment = (nextPaymentDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    if (daysUntilPayment <= 15) {
        return PaymentStatus.Pending;
    }
    return PaymentStatus.Paid;
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode, subtext?: string }> = ({ title, value, icon, subtext }) => (
    <Card>
        <CardContent className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
                {subtext && <p className="text-xs text-slate-500 dark:text-slate-400">{subtext}</p>}
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-lg">
                {icon}
            </div>
        </CardContent>
    </Card>
);

const PaymentsSummaryChart: React.FC<{data: {name: string, value: number}[]}> = ({data}) => {
    const COLORS = {
        [PaymentStatus.Paid]: '#22c55e',
        [PaymentStatus.Pending]: '#f59e0b',
        [PaymentStatus.Overdue]: '#ef4444'
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />)}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}

const MonthlyRevenueChart: React.FC<{data: {name: string, total: number}[]}> = ({data}) => {
    return (
         <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                    contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        borderColor: 'rgba(128, 128, 128, 0.2)'
                    }} 
                />
                <Legend />
                <Bar dataKey="total" name="Ingresos" fill="#3b82f6" />
            </BarChart>
        </ResponsiveContainer>
    )
}

const UpcomingPayments: React.FC<{clients: Client[]}> = ({ clients }) => {
    const today = new Date();
    const upcoming = clients
        .filter(c => getClientPaymentStatus(c, today) === PaymentStatus.Pending)
        .sort((a,b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime())
        .slice(0, 5);

    return (
        <Card className="h-full">
            <CardHeader><h3 className="font-semibold">Próximos Pagos</h3></CardHeader>
            <CardContent>
                {upcoming.length > 0 ? (
                    <ul className="space-y-3">
                        {upcoming.map(c => (
                            <li key={c.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{c.name}</p>
                                    <p className="text-sm text-slate-500">Vence: {new Date(c.nextPaymentDate).toLocaleDateString()}</p>
                                </div>
                                <p className="font-semibold text-right">${c.paymentAmount.toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">No hay pagos próximos en los siguientes 15 días.</p>
                )}
            </CardContent>
        </Card>
    )
}


export const Dashboard: React.FC<{setView: (view: View) => void}> = ({setView}) => {
    const context = useContext(DataContext);

    const { stats, monthlyRevenueData } = useMemo(() => {
        if (!context) return { stats: { totalClients: 0, monthlyRevenue: 0, paid: 0, pending: 0, overdue: 0, overdueCount: 0 }, monthlyRevenueData: [] };
        
        const today = new Date();
        const clientStatus = context.clients.map(c => getClientPaymentStatus(c, today));
        
        const stats = {
            totalClients: context.clients.length,
            monthlyRevenue: context.clients.reduce((acc, c) => c.paymentFrequency === PaymentFrequency.Monthly ? acc + c.paymentAmount : acc, 0),
            paid: clientStatus.filter(s => s === PaymentStatus.Paid).length,
            pending: clientStatus.filter(s => s === PaymentStatus.Pending).length,
            overdue: clientStatus.filter(s => s === PaymentStatus.Overdue).length,
            overdueCount: clientStatus.filter(s => s === PaymentStatus.Overdue).length,
        };

        const revenueData: {name: string, total: number}[] = [];
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.getMonth();
            const year = d.getFullYear();
            
            const total = context.payments
                .filter(p => new Date(p.paymentDate).getMonth() === month && new Date(p.paymentDate).getFullYear() === year)
                .reduce((acc, p) => acc + p.amount, 0);

            revenueData.push({ name: monthNames[month], total });
        }

        return { stats, monthlyRevenueData: revenueData };
    }, [context]);

    if (!context) return <div>Cargando...</div>;

    const { clients } = context;
    const paymentStatusChartData = [
        { name: PaymentStatus.Paid, value: stats.paid },
        { name: PaymentStatus.Pending, value: stats.pending },
        { name: PaymentStatus.Overdue, value: stats.overdue },
    ];

    const statusConfig = {
      [PaymentStatus.Paid]: { color: 'green', text: 'Pagado' },
      [PaymentStatus.Pending]: { color: 'yellow', text: 'Pendiente' },
      [PaymentStatus.Overdue]: { color: 'red', text: 'Vencido' },
    } as const;


    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total de Clientes" value={stats.totalClients.toString()} icon={<Users size={24}/>} />
                <StatCard title="Ingreso Mensual Est." value={`$${stats.monthlyRevenue.toLocaleString()}`} icon={<DollarSign size={24} />} subtext="De planes mensuales"/>
                <StatCard title="Activos y Pendientes" value={(stats.paid + stats.pending).toString()} icon={<UserCheck size={24} />} />
                <StatCard title="Pagos Vencidos" value={stats.overdue.toString()} icon={<UserX size={24}/>} />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <h3 className="font-semibold">Resumen de Estado de Pagos</h3>
                    </CardHeader>
                    <CardContent>
                        <PaymentsSummaryChart data={paymentStatusChartData} />
                    </CardContent>
                </Card>
                 <UpcomingPayments clients={clients} />
            </div>

             <div className="grid gap-6">
                 <Card>
                    <CardHeader>
                        <h3 className="font-semibold">Ingresos Mensuales (Últimos 6 meses)</h3>
                    </CardHeader>
                    <CardContent>
                        <MonthlyRevenueChart data={monthlyRevenueData} />
                    </CardContent>
                </Card>
            </div>

            <div>
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="font-semibold">Clientes con Pagos Vencidos Recientemente</h3>
                        <Button variant="ghost" onClick={() => setView('clients')}>Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-3">Cliente</th>
                                        <th className="px-6 py-3">Próxima Fecha de Pago</th>
                                        <th className="px-6 py-3">Monto</th>
                                        <th className="px-6 py-3">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.filter(c => getClientPaymentStatus(c, new Date()) === PaymentStatus.Overdue).slice(0,5).map(client => (
                                        <tr key={client.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                            <td className="px-6 py-4 font-medium whitespace-nowrap">{client.name}</td>
                                            <td className="px-6 py-4">{new Date(client.nextPaymentDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">${client.paymentAmount.toLocaleString()}</td>
                                            <td className="px-6 py-4"><Badge color={statusConfig[PaymentStatus.Overdue].color}>{statusConfig[PaymentStatus.Overdue].text}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};