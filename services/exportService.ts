

import { Client, Payment } from '../types';

declare const XLSX: any;

export const exportToExcel = (clients: Client[], payments: Payment[], getClientName: (clientId: string) => string) => {
  // Client Data Sheet
  const clientWorksheet = XLSX.utils.json_to_sheet(clients.map(c => ({
    'ID': c.id,
    'Nombre': c.name,
    'RUC': c.ruc || 'N/A',
    'Teléfono': c.phone,
    'Correo Electrónico': c.email,
    'Tipo de Servicio': c.serviceType,
    'Unidades GPS': c.gpsUnits,
    'Monto de Pago': c.paymentAmount,
    'Frecuencia de Pago': c.paymentFrequency,
    'Próxima Fecha de Pago': new Date(c.nextPaymentDate).toLocaleDateString(),
    'Fecha de Registro': new Date(c.registrationDate).toLocaleDateString(),
    'Notas': c.notes || '', // Nuevo campo
    'Estado Activo': c.isActive !== undefined ? (c.isActive ? 'Activo' : 'Inactivo') : 'N/A', // Nuevo campo
  })));

  // Payment Data Sheet
  const paymentWorksheet = XLSX.utils.json_to_sheet(payments.map(p => ({
    'ID de Pago': p.id,
    'Nombre del Cliente': getClientName(p.clientId),
    'Monto': p.amount,
    'Fecha de Pago': new Date(p.paymentDate).toLocaleDateString(),
    'Mes': p.month,
    'Año': p.year,
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, clientWorksheet, "Clientes");
  XLSX.utils.book_append_sheet(workbook, paymentWorksheet, "Pagos");

  XLSX.writeFile(workbook, "Datos_GPS_Tracker_Panama.xlsx");
};