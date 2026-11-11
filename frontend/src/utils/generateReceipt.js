import jsPDF from 'jspdf';

export const downloadReceipt = (payment, studentName) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Fee Receipt', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Student: ${studentName}`, 14, 35);
  doc.text(`Payment Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 14, 43);
  doc.text(`Amount Paid: ${payment.amount}`, 14, 51);
  doc.text(`Mode: ${payment.mode}`, 14, 59);
  doc.text(`Reference: ${payment.reference || 'N/A'}`, 14, 67);
  doc.text(`Received By: ${payment.receivedBy?.name || 'Admin'}`, 14, 75);
  doc.save(`receipt_${payment._id.slice(-6)}.pdf`);
};