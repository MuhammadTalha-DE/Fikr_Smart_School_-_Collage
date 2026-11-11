import jsPDF from 'jspdf';

export const generateTripSheetPDF = (tripSheetData, vehicleId) => {
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(16);
  doc.text('Transport Trip Sheet', 105, y, { align: 'center' });
  y += 10;

  // If a specific vehicle is selected, only show that vehicle's data
  const vehicles = vehicleId
    ? { [vehicleId]: tripSheetData[vehicleId] }
    : tripSheetData;

  Object.values(vehicles).forEach((vData) => {
    if (!vData) return;
    const vehicle = vData.vehicle;
    doc.setFontSize(13);
    doc.text(`Vehicle: ${vehicle.registrationNumber} (Capacity: ${vehicle.capacity})`, 14, y);
    y += 6;
    doc.setFontSize(11);
    doc.text(`Driver: ${vehicle.driverName || 'N/A'} | Contact: ${vehicle.driverContact || 'N/A'}`, 14, y);
    y += 8;

    Object.values(vData.routes).forEach((rData) => {
      const route = rData.route;
      doc.setFontSize(12);
      doc.text(`Route: ${route.name}`, 14, y);
      y += 6;
      // Stops
      if (route.stops && route.stops.length) {
        doc.setFontSize(10);
        doc.text('Stops:', 14, y);
        y += 5;
        route.stops.forEach((stop) => {
          doc.text(`  ${stop.order}. ${stop.location}`, 14, y);
          y += 4;
        });
      }
      // Students
      doc.setFontSize(10);
      doc.text('Students:', 14, y);
      y += 5;
      rData.students.forEach((s, idx) => {
        doc.text(`  ${idx + 1}. ${s.student?.userId?.name || s.student?.admissionNumber} – Pickup: ${s.pickupStop}`, 14, y);
        y += 4;
      });
      y += 4;
    });
    y += 8;
  });

  doc.save(`trip-sheet-${new Date().toISOString().slice(0, 10)}.pdf`);
};