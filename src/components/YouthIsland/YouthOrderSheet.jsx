export function YouthOrderSheet({ sheet }) {
  return (
    <div className="youth-order-sheet">
      <h3>{sheet.title}</h3>
      <table className="youth-order-table">
        <tbody>
          {sheet.rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="youth-order-footer">
        <p>Dato for bestilling af UØ: {sheet.orderDate}</p>
        <p>Hvem har bestilt: {sheet.orderedBy}</p>
      </div>
    </div>
  );
}
