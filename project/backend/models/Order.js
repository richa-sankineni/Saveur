module.exports = {
  tableName: 'orders',
  statusFlow: ['received', 'preparing', 'ready', 'completed'],
  validTransitions: { received: ['preparing'], preparing: ['ready'], ready: ['completed'], completed: [] },
};
