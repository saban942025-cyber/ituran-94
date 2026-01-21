// lib/microsoftGraph.js
export async function getDeliveryTickets() {
  const accessToken = await getGraphToken(); // פונקציה שמשיגה Token
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const data = await response.json();
  return data.value.map(item => ({
    id: item.fields.TicketID,
    customer: item.fields.Customer,
    status: item.fields.Status, // 'Red' or 'Green'
    craneTime: item.fields.CraneMinutes,
    pdfLink: item.fields.Attachments === "true" ? `${url}/${item.id}/attachments` : null
  }));
}
