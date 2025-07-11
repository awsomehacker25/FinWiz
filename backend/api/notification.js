module.exports = async function (context, req) {
  // TODO: Integrate with Azure Notification Hubs
  context.res = { status: 200, body: { message: 'Notification sent (stub)' } };
}; 