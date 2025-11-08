import React, { useState, useContext, useMemo } from 'react';
import { Client, Payment, PaymentFrequency, PaymentStatus } from '../../types';
import { DataContext } from '../../hooks/DataContext';
import { Button, Card, CardHeader, CardContent, Input, Select, Modal, Badge } from '../ui';
import { PlusCircle, Search, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const getYears = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2, currentYear -3];
}

interface PaymentFormProps {
    onClose: () => void;
    // FIX: Update onSave prop type to omit userId, aligning with data context.
    onSave: (payment: Omit<Payment, 'id' | 'userId'>) => void;
    details?: { client: Client, month: number, year: number };
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onClose, onSave, details }) => {
  const context = useContext(DataContext);
  const [formData, setFormData] = useState({
    clientId: details?.client.id || context?.clients[0]?.id || '',
    amount: details?.client.paymentAmount.toString() || '',
    paymentDate: new Date().toISOString().split('T')[0],
    month: details?.month || new Date().getMonth() + 1,
    year: details?.year || new Date().getFullYear()
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const valueAsNumber = (name === 'month' || name === 'year') ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: valueAsNumber }));
    
    // If client changes, update amount
    if(name === 'clientId' && context) {
        const selectedClient = context.getClientById(value);
        if(selectedClient) {
            setFormData(prev => ({...prev, amount: selectedClient.paymentAmount.toString()}));
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
        toast.error("Por favor seleccione un cliente.");
        return;
    }
    const paymentDate = new Date(formData.paymentDate);
    const timezoneOffset = paymentDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(paymentDate.getTime() + timezoneOffset);

    const paymentData = {
        clientId: formData.clientId,
        amount: Number(formData.amount),
        paymentDate: adjustedDate.toISOString(),
        month: Number(formData.month),
        year: Number(formData.year),
    };
    onSave(paymentData);
  };

  if (!context) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Cliente" name="clientId" value={formData.clientId} onChange={handleChange} required disabled={!!details?.client}>
            <option value="" disabled>Seleccione un cliente</option>
            {context.clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
            ))}
        </Select>
        <Input label="Monto ($)" name="amount" type="number" value={formData.amount} onChange={handleChange} required min="0" step="0.01" />
        <Select label="Pago para el Mes" name="month" value={formData.month} onChange={handleChange} required>
            {MONTHS.map((month, index) => <option key={month} value={index+1}>{month}</option>)}
        </Select>
         <Select label="Pago para el Año" name="year" value={formData.year} onChange={handleChange} required>
            {getYears().map(year => <option key={year} value={year}>{year}</option>)}
        </Select>
      </div>
      <Input label="Fecha de Pago" name="paymentDate" type="date" value={formData.paymentDate} onChange={handleChange} required />
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Registrar Pago</Button>
      </div>
    </form>
  );
};

const getClientPaymentStatusForMonth = (client: Client, month: number, year: number, payments: Payment[], today: Date): { status: PaymentStatus, payment?: Payment } => {
    const registrationDate = new Date(client.registrationDate);
    const firstDayOfFilterMonth = new Date(year, month - 1, 1);
    
    // If the client wasn't registered yet for the filtered month, they don't owe anything.
    if (registrationDate > firstDayOfFilterMonth && !(registrationDate.getMonth() === firstDayOfFilterMonth.getMonth() && registrationDate.getFullYear() === firstDayOfFilterMonth.getFullYear())) {
         return { status: PaymentStatus.Paid }; // Effectively N/A, shown as paid
    }
    
    // Handle annual clients
    if (client.paymentFrequency === PaymentFrequency.Annual) {
        const paymentMonth = new Date(client.nextPaymentDate).getUTCMonth() + 1;
        const annualPaymentForYear = payments.find(p => p.clientId === client.id && p.year === year);
        
        if (annualPaymentForYear) return { status: PaymentStatus.Paid, payment: annualPaymentForYear };
        
        const dueDate = new Date(Date.UTC(year, paymentMonth - 1, new Date(client.nextPaymentDate).getUTCDate()));
        return today > dueDate ? { status: PaymentStatus.Overdue } : { status: PaymentStatus.Pending };
    }

    // Handle monthly clients
    const payment = payments.find(p => p.clientId === client.id && p.month === month && p.year === year);
    if (payment) return { status: PaymentStatus.Paid, payment };

    const dueDateDay = new Date(client.nextPaymentDate).getUTCDate();
    const dueDateForMonth = new Date(Date.UTC(year, month - 1, dueDateDay));
    
    if (today > dueDateForMonth) return { status: PaymentStatus.Overdue };

    return { status: PaymentStatus.Pending };
};

export const PaymentManagement: React.FC = () => {
  const context = useContext(DataContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All');
  const [paymentDetails, setPaymentDetails] = useState<PaymentFormProps['details'] | undefined>();

  const filteredClients = useMemo(() => {
    if (!context) return [];
    return context.clients.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [context, searchQuery]);

  const clientsWithStatus = useMemo(() => {
    if (!context) return [];
    const allClientsWithStatus = filteredClients.map(client => {
      const { status, payment } = getClientPaymentStatusForMonth(client, filterMonth, filterYear, context.payments, new Date());
      return { client, status, payment };
    });

    if (statusFilter === 'All') {
        return allClientsWithStatus;
    }
    return allClientsWithStatus.filter(item => item.status === statusFilter);

  }, [filteredClients, filterMonth, filterYear, context, statusFilter]);
  
  if (!context) return <div>Cargando...</div>;

  const { addPayment, getClientById, updateClient } = context;

  const openModalForNew = (details?: PaymentFormProps['details']) => {
    setPaymentDetails(details);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPaymentDetails(undefined);
  };

  const handleSave = (paymentData: Omit<Payment, 'id' | 'userId'>) => {
    addPayment(paymentData);
    toast.success('¡Pago registrado exitosamente!');

    const client = getClientById(paymentData.clientId);
    if (client) {
        const currentNextPayment = new Date(client.nextPaymentDate);
        const nextPaymentMonth = currentNextPayment.getUTCMonth() + 1;
        const nextPaymentYear = currentNextPayment.getUTCFullYear();

        if ((client.paymentFrequency === PaymentFrequency.Monthly && paymentData.month === nextPaymentMonth && paymentData.year === nextPaymentYear) ||
            (client.paymentFrequency === PaymentFrequency.Annual && paymentData.year === nextPaymentYear)) {
            let newNextPayment: Date;
            if (client.paymentFrequency === PaymentFrequency.Monthly) {
                newNextPayment = new Date(currentNextPayment.setUTCMonth(currentNextPayment.getUTCMonth() + 1));
            } else {
                newNextPayment = new Date(currentNextPayment.setUTCFullYear(currentNextPayment.getUTCFullYear() + 1));
            }
            updateClient({ ...client, nextPaymentDate: newNextPayment.toISOString() });
            toast.success(`Próxima fecha de pago de ${client.name} actualizada.`);
        }
    }
    closeModal();
  };

  const handleCopyToClipboard = () => {
    if (!clientsWithStatus) {
        toast.error("No hay datos para copiar.");
        return;
    }
    const header = "Cliente\tEstado\tMonto\tFecha de Pago\n";
    const rows = clientsWithStatus.map(item => {
        return [
            item.client.name,
            statusConfig[item.status].text,
            item.client.paymentAmount.toLocaleString(),
            item.payment ? new Date(item.payment.paymentDate).toLocaleDateString() : 'N/A'
        ].join('\t');
    }).join('\n');

    navigator.clipboard.writeText(header + rows).then(() => {
        toast.success('Datos copiados al portapapeles, ¡listos para pegar en Google Sheets!');
    }, (err) => {
        toast.error('No se pudieron copiar los datos.');
        console.error('Error al copiar al portapapeles', err);
    });
  };

  const statusConfig = {
    [PaymentStatus.Paid]: { color: 'green', text: 'Pagado' },
    [PaymentStatus.Pending]: { color: 'yellow', text: 'Pendiente' },
    [PaymentStatus.Overdue]: { color: 'red', text: 'Vencido' },
  } as const;


  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-1/3">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input
                type="text"
                placeholder="Buscar por nombre de cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div className="flex items-center flex-wrap justify-end gap-2 w-full md:w-auto">
             <Select label="" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="w-full sm:w-auto">
                {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
             </Select>
             <Select label="" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="w-full sm:w-auto">
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
             </Select>
             <Select label="" value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'All' | PaymentStatus)} className="w-full sm:w-auto">
                <option value="All">Todos</option>
                <option value={PaymentStatus.Paid}>Pagado</option>
                <option value={PaymentStatus.Pending}>Pendiente</option>
                <option value={PaymentStatus.Overdue}>Vencido</option>
             </Select>
             <Button variant="secondary" onClick={handleCopyToClipboard} className="whitespace-nowrap"><Copy className="mr-2 h-4 w-4"/>Copiar p/ Sheets</Button>
             <Button onClick={() => openModalForNew()} className="whitespace-nowrap"><PlusCircle className="mr-2 h-4 w-4" />Registrar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Monto</th>
                  <th className="px-6 py-3">Fecha de Pago</th>
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientsWithStatus.map(({client, status, payment}) => {
                  return (
                    <tr key={client.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 font-medium whitespace-nowrap">{client.name}</td>
                        <td className="px-6 py-4">
                            <Badge color={statusConfig[status].color}>{statusConfig[status].text}</Badge>
                        </td>
                        <td className="px-6 py-4">${client.paymentAmount.toLocaleString()}</td>
                        <td className="px-6 py-4">{payment ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-right">
                           {status !== PaymentStatus.Paid && (
                                <Button size-sm="true" onClick={() => openModalForNew({client, month: filterMonth, year: filterYear})}>
                                    Registrar Pago
                                </Button>
                           )}
                        </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
             {clientsWithStatus.length === 0 && <p className="text-center py-8 text-slate-500">No se encontraron clientes para los filtros seleccionados.</p>}
          </div>
        </CardContent>
      </Card>
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Registrar Nuevo Pago">
        <PaymentForm onClose={closeModal} onSave={handleSave} details={paymentDetails} />
      </Modal>
    </>
  );
};
