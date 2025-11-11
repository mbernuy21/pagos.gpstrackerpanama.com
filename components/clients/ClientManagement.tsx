

import React, { useState, useContext, useMemo } from 'react';
import { Client, Payment, PaymentFrequency, ServiceType } from '../../types';
import { DataContext, IDataContext } from '../../hooks/DataContext';
import { Button, Card, CardHeader, CardContent, Input, Select, Modal, Textarea, Badge } from '../ui';
import { PlusCircle, Edit, Trash2, FileDown, Search, FileText, Upload, Copy } from 'lucide-react';
import { exportToExcel } from '../../services/exportService';
import toast from 'react-hot-toast';

// @ts-ignore
const { jsPDF } = window.jspdf;

const generatePdf = (client: Client, payments: Payment[]) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("GPS Tracker Panama", 14, 22);
    doc.setFontSize(12);
    doc.text("Estado de Cuenta de Cliente", 14, 30);

    // Client Info
    doc.setFontSize(10);
    doc.text(`Cliente: ${client.name}`, 14, 45);
    doc.text(`Correo: ${client.email}`, 14, 50);
    doc.text(`Teléfono: ${client.phone}`, 14, 55);
    if (client.ruc) {
        doc.text(`RUC: ${client.ruc}`, 14, 60);
    }
    if (client.notes) {
        doc.text(`Notas: ${client.notes}`, 14, 65);
    }
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 140, 45);

    // Table
    const tableColumn = ["ID de Pago", "Fecha de Pago", "Mes", "Año", "Monto"];
    const tableRows: (string | number)[][] = [];

    payments.forEach(payment => {
        const paymentData = [
            payment.id,
            new Date(payment.paymentDate).toLocaleDateString(),
            payment.month,
            payment.year,
            `$${payment.amount.toLocaleString()}`
        ];
        tableRows.push(paymentData);
    });

    // @ts-ignore
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70, // Ajustar startY si se añaden más campos arriba
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }
    
    doc.save(`Estado_de_Cuenta_${client.name.replace(/ /g, '_')}.pdf`);
}

const ImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    // FIX: Changed onImport prop to omit userId, as it's added by the data context.
    onImport: (clients: Omit<Client, 'id' | 'registrationDate' | 'userId'>[]) => void;
}> = ({ isOpen, onClose, onImport }) => {
    const [pastedData, setPastedData] = useState('');

    const handleImport = () => {
        const lines = pastedData.trim().split('\n');
        if (lines.length <= 1) {
            toast.error("No hay datos para importar. Por favor pegue los datos de los clientes, incluyendo la fila de encabezado.");
            return;
        }

        const header = lines.shift()!.split('\t').map(h => h.trim());
        // Añadir 'Notas' como encabezado esperado. Es opcional, así que la validación será más flexible.
        const expectedHeaders = ['Nombre', 'RUC', 'Teléfono', 'Correo Electrónico', 'Tipo de Servicio', 'Unidades GPS', 'Monto de Pago', 'Frecuencia de Pago', 'Próxima Fecha de Pago', 'Notas'];
        
        // Simple header validation, allowing for missing 'Notas' column
        const validHeadersCount = expectedHeaders.filter(h => header.map(h => h.toLowerCase()).includes(h.toLowerCase())).length;
        if (validHeadersCount < expectedHeaders.length -1) { // -1 because 'Notas' is optional
             toast.error("Los encabezados no coinciden. Asegúrese de que las columnas están en el orden correcto.", { duration: 5000 });
             return;
        }
        
        const headerMap = new Map(header.map((h, i) => [h.toLowerCase(), i]));


        let successfulImports = 0;
        let failedImports = 0;
        // FIX: Update type to omit userId, matching the data context expectation for new clients.
        const clientsToImport: Omit<Client, 'id' | 'registrationDate' | 'userId'>[] = [];

        lines.forEach((line, index) => {
            const data = line.split('\t');
            // Allow for data.length to be less than expectedHeaders.length if optional columns are missing
            if (data.length < expectedHeaders.length - 1) { // -1 for optional 'Notas'
                failedImports++;
                console.warn(`Fila ${index + 2}: Número incorrecto de columnas.`);
                return;
            }

            try {
                const name = data[headerMap.get('nombre')!];
                const ruc = data[headerMap.get('ruc')!];
                const phone = data[headerMap.get('teléfono')!];
                const email = data[headerMap.get('correo electrónico')!];
                const serviceType = data[headerMap.get('tipo de servicio')!];
                const gpsUnits = data[headerMap.get('unidades gps')!];
                const paymentAmount = data[headerMap.get('monto de pago')!];
                const paymentFrequency = data[headerMap.get('frecuencia de pago')!];
                const nextPaymentDate = data[headerMap.get('próxima fecha de pago')!];
                const notes = data[headerMap.get('notas')!]; // Get notes if present


                const isValidServiceType = Object.values(ServiceType).includes(serviceType as ServiceType);
                const isValidFrequency = Object.values(PaymentFrequency).includes(paymentFrequency as PaymentFrequency);
                
                if (!name || !phone || !email || !isValidServiceType || !isValidFrequency || !nextPaymentDate) {
                     failedImports++;
                     console.warn(`Fila ${index + 2}: Faltan datos obligatorios o los valores son inválidos.`);
                     return;
                }

                clientsToImport.push({
                    name,
                    ruc: ruc || undefined,
                    phone,
                    email,
                    serviceType: serviceType as ServiceType,
                    gpsUnits: parseInt(gpsUnits, 10),
                    paymentAmount: parseFloat(paymentAmount),
                    paymentFrequency: paymentFrequency as PaymentFrequency,
                    nextPaymentDate: new Date(nextPaymentDate).toISOString(),
                    notes: notes || undefined, // Add notes
                });
                successfulImports++;
            } catch (e) {
                failedImports++;
                console.error(`Error procesando la fila ${index + 2}:`, e);
            }
        });

        if (clientsToImport.length > 0) {
            onImport(clientsToImport);
        }
        
        toast.success(`${successfulImports} clientes importados. ${failedImports > 0 ? `${failedImports} filas fallaron.` : ''}`);
        onClose();
    };
    
    // Actualizar instrucciones para incluir 'Notas'
    const instructions = "Nombre\tRUC\tTeléfono\tCorreo Electrónico\tTipo de Servicio\tUnidades GPS\tMonto de Pago\tFrecuencia de Pago\tPróxima Fecha de Pago\tNotas";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Clientes desde Sheets">
            <div className="space-y-4">
                <p className="text-sm text-slate-500">
                    Copie los datos de su hoja de cálculo (incluyendo la fila de encabezado) y péguelos a continuación. Asegúrese de que las columnas estén en el siguiente orden:
                </p>
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono break-words">
                    {instructions}
                </div>
                <Textarea 
                    label="Pegue los datos aquí"
                    rows={10}
                    value={pastedData}
                    onChange={e => setPastedData(e.target.value)}
                    placeholder="Encabezados + filas de datos del cliente..."
                />
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleImport}>Importar Clientes</Button>
                </div>
            </div>
        </Modal>
    );
};


const StatementModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    client: Client,
    payments: Payment[]
}> = ({ isOpen, onClose, client, payments }) => {
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    
    const clientPayments = useMemo(() => {
        return payments
            .filter(p => p.clientId === client.id && p.year === filterYear)
            .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [payments, client.id, filterYear]);

    const getYearsWithPayments = useMemo(() => {
        const years = new Set(payments.filter(p => p.clientId === client.id).map(p => p.year));
        const currentYear = new Date().getFullYear();
        if(!years.has(currentYear)) years.add(currentYear);
        // FIX: Explicitly convert values to numbers before subtracting to prevent type errors
        // if a payment record is missing a year and results in a non-numeric value.
        return Array.from(years).sort((a,b) => Number(b) - Number(a));
    }, [payments, client.id]);

    const handleGeneratePdf = () => {
        generatePdf(client, clientPayments);
        toast.success('PDF del estado de cuenta generado!');
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Estado de Cuenta: ${client.name}`}>
            <div className="space-y-4">
                <p className="text-sm text-slate-500">
                    <span className="font-semibold">Cliente:</span> {client.name}<br/>
                    <span className="font-semibold">Correo:</span> {client.email}<br/>
                    <span className="font-semibold">Teléfono:</span> {client.phone}<br/>
                    {client.ruc && <><span className="font-semibold">RUC:</span> {client.ruc}<br/></>}
                    {client.notes && <><span className="font-semibold">Notas:</span> {client.notes}<br/></>} {/* Mostrar notas */}
                </p>
                <div className="flex justify-between items-center">
                    <Select label="Año" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
                        {getYearsWithPayments.map(y => <option key={y} value={y}>{y}</option>)}
                    </Select>
                    <Button onClick={handleGeneratePdf} disabled={clientPayments.length === 0}>
                        <FileDown className="mr-2 h-4 w-4"/>Descargar PDF
                    </Button>
                </div>
                 <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Fecha de Pago</th>
                                <th className="px-6 py-3">Mes/Año</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                             {clientPayments.length > 0 ? clientPayments.map(p => (
                                <tr key={p.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                    <td className="px-6 py-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{p.month}/{p.year}</td>
                                    <td className="px-6 py-4 text-right">${p.amount.toLocaleString()}</td>
                                </tr>
                             )) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-slate-500">No se encontraron pagos para el año seleccionado.</td>
                                </tr>
                             )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </Modal>
    )
}

// FIX: Update onSave prop to omit userId for new clients, matching data context.
const ClientForm: React.FC<{ client?: Client; onClose: () => void, onSave: (client: Omit<Client, 'id' | 'registrationDate' | 'userId'> | Client) => void }> = ({ client, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    ruc: client?.ruc || '',
    phone: client?.phone || '',
    email: client?.email || '',
    serviceType: client?.serviceType || ServiceType.GPS_RENTAL,
    gpsUnits: client?.gpsUnits || 0,
    paymentAmount: client?.paymentAmount || 0,
    paymentFrequency: client?.paymentFrequency || PaymentFrequency.Monthly,
    nextPaymentDate: client?.nextPaymentDate ? client.nextPaymentDate.split('T')[0] : '',
    notes: client?.notes || '', // Añadir campo de notas al estado
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentDate = new Date(formData.nextPaymentDate);
    const timezoneOffset = paymentDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(paymentDate.getTime() + timezoneOffset);

    const clientData = {
        ...formData,
        gpsUnits: Number(formData.gpsUnits),
        paymentAmount: Number(formData.paymentAmount),
        nextPaymentDate: adjustedDate.toISOString(),
        notes: formData.notes || undefined, // Guardar notas, o undefined si está vacío
    };
    
    if (client) {
        onSave({ ...client, ...clientData });
    } else {
        onSave(clientData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nombre o Empresa" name="name" value={formData.name} onChange={handleChange} required />
        <Input label="RUC (Opcional)" name="ruc" value={formData.ruc} onChange={handleChange} />
        <Input label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} required />
        <Input label="Correo Electrónico" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <Select label="Tipo de Servicio" name="serviceType" value={formData.serviceType} onChange={handleChange} required>
            {Object.values(ServiceType).map(type => <option key={type} value={type}>{type}</option>)}
        </Select>
        <Input label="Número de Unidades GPS" name="gpsUnits" type="number" value={formData.gpsUnits} onChange={handleChange} required min="0" />
        <Input label="Monto de Pago ($)" name="paymentAmount" type="number" value={formData.paymentAmount} onChange={handleChange} required min="0" />
        <Select label="Frecuencia de Pago" name="paymentFrequency" value={formData.paymentFrequency} onChange={handleChange} required>
            <option value={PaymentFrequency.Monthly}>Mensual</option>
            <option value={PaymentFrequency.Annual}>Anual</option>
        </Select>
        <Input label="Próxima Fecha de Pago" name="nextPaymentDate" type="date" value={formData.nextPaymentDate} onChange={handleChange} required />
      </div>
      <Textarea label="Notas (Opcional)" name="notes" value={formData.notes} onChange={handleChange} rows={3} /> {/* Nuevo campo de notas */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">{client ? 'Actualizar' : 'Crear'} Cliente</Button>
      </div>
    </form>
  );
};


export const ClientManagement: React.FC = () => {
  const context = useContext(DataContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [statementClient, setStatementClient] = useState<Client | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const isClientActive = (client: Client): boolean => {
      const today = new Date();
      const nextPaymentDate = new Date(client.nextPaymentDate);
      const diffTime = today.getTime() - nextPaymentDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays <= 60; // Inactive if overdue by more than 60 days
  };

  const filteredClients = useMemo(() => {
    if (!context) return [];
    
    const searchFiltered = context.clients.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.ruc && client.ruc.includes(searchQuery))
    );

    if (statusFilter === 'all') return searchFiltered;

    return searchFiltered.filter(client => {
        const active = isClientActive(client);
        return statusFilter === 'active' ? active : !active;
    });

  }, [context, searchQuery, statusFilter]);

  if (!context) return <div>Cargando...</div>;

  const { addClient, updateClient, deleteClient, clients, payments, getClientById, addMultipleClients } = context as IDataContext;

  const openModalForNew = () => {
    setEditingClient(undefined);
    setIsModalOpen(true);
  };

  const openModalForEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(undefined);
  };
  
  const openStatementModal = (client: Client) => {
    setStatementClient(client);
  }
  
  const closeStatementModal = () => {
    setStatementClient(null);
  }
  
  const handleImport = (newClients: Omit<Client, 'id' | 'registrationDate' | 'userId'>[]) => {
      addMultipleClients(newClients);
  };

  const handleSave = (clientData: Omit<Client, 'id' | 'registrationDate' | 'userId'> | Client) => {
    if ('id' in clientData) {
      updateClient(clientData);
      toast.success('¡Cliente actualizado exitosamente!');
    } else {
      addClient(clientData);
      toast.success('¡Cliente añadido exitosamente!');
    }
    closeModal();
  };
  
  const handleDeleteRequest = (clientId: string) => {
    setClientToDelete(clientId);
    setIsDeleteModalOpen(true);
  }

  const confirmDelete = () => {
    if (clientToDelete) {
        deleteClient(clientToDelete);
        toast.success('¡Cliente eliminado exitosamente!');
    }
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  }

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  }
  
  const handleCopyForSheets = () => {
    // Actualizar encabezados para incluir 'Notas'
    const header = ['Nombre', 'RUC', 'Teléfono', 'Correo Electrónico', 'Tipo de Servicio', 'Unidades GPS', 'Monto de Pago', 'Frecuencia de Pago', 'Próxima Fecha de Pago', 'Notas'].join('\t');
    const rows = filteredClients.map(c => [
        c.name,
        c.ruc || '',
        c.phone,
        c.email,
        c.serviceType,
        c.gpsUnits,
        c.paymentAmount,
        c.paymentFrequency,
        new Date(c.nextPaymentDate).toISOString().split('T')[0],
        c.notes || '' // Añadir notas
    ].join('\t')).join('\n');

    navigator.clipboard.writeText(header + '\n' + rows).then(() => {
        toast.success('Datos de clientes copiados al portapapeles!');
    }, () => {
        toast.error('No se pudieron copiar los datos.');
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
             <div className="relative w-full sm:w-auto">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                 <input
                    type="text"
                    placeholder="Buscar clientes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                />
             </div>
             <Select label="" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                <option value="all">Todos los Estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
             </Select>
          </div>
          <div className="flex flex-wrap items-center space-x-2 flex-shrink-0 justify-end">
             <Button variant="secondary" onClick={handleCopyForSheets} className="whitespace-nowrap"><Copy className="mr-2 h-4 w-4"/>Copiar p/ Sheets</Button>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(true)} className="whitespace-nowrap"><Upload className="mr-2 h-4 w-4"/>Importar</Button>
            <Button onClick={openModalForNew} className="whitespace-nowrap"><PlusCircle className="mr-2 h-4 w-4" />Nuevo Cliente</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Contacto</th>
                  <th className="px-6 py-3">Servicio y Plan</th>
                  <th className="px-6 py-3">Próximo Pago</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => {
                  const isActive = isClientActive(client);
                  return (
                    <tr key={client.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 font-medium whitespace-nowrap">{client.name}</td>
                        <td className="px-6 py-4">
                            <div>{client.phone}</div>
                            <div className="text-slate-500">{client.email}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div>{client.serviceType}</div>
                            <div className="text-slate-500">${client.paymentAmount.toLocaleString()}/{client.paymentFrequency === PaymentFrequency.Monthly ? 'mes' : 'año'} ({client.gpsUnits} unidades)</div>
                        </td>
                        <td className="px-6 py-4">{new Date(client.nextPaymentDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                            <Badge color={isActive ? 'green' : 'gray'}>{isActive ? 'Activo' : 'Inactivo'}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" className="!p-2 h-auto" onClick={() => openStatementModal(client)} title="Estado de Cuenta"><FileText size={16} /></Button>
                            <Button variant="ghost" className="!p-2 h-auto" onClick={() => openModalForEdit(client)} title="Editar"><Edit size={16} /></Button>
                            <Button variant="ghost" className="!p-2 h-auto text-red-500 hover:text-red-600" onClick={() => handleDeleteRequest(client.id)} title="Eliminar"><Trash2 size={16} /></Button>
                          </div>
                        </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
             {filteredClients.length === 0 && <p className="text-center py-8 text-slate-500">No se encontraron clientes.</p>}
          </div>
        </CardContent>
      </Card>
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}>
        <ClientForm client={editingClient} onClose={closeModal} onSave={handleSave} />
      </Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title="Confirmar Eliminación">
        <div className="space-y-6">
            <p>¿Está seguro de que desea eliminar este cliente y todos sus pagos? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={cancelDelete}>Cancelar</Button>
                <Button variant="danger" onClick={confirmDelete}>Eliminar</Button>
            </div>
        </div>
      </Modal>
       {statementClient && (
        <StatementModal 
            isOpen={!!statementClient} 
            onClose={closeStatementModal} 
            client={statementClient}
            payments={payments}
        />
       )}
       <ImportModal 
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImport}
        />
    </>
  );
};