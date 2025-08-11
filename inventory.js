// DOM Elements
const inventoryTableBody = document.getElementById('inventoryTableBody');
const searchInput = document.getElementById('searchInput');
const addItemBtn = document.getElementById('addItemBtn');
const checkoutItemBtn = document.getElementById('checkoutItemBtn');
const returnItemBtn = document.getElementById('returnItemBtn');

// Modal Elements
const addItemModal = document.getElementById('addItemModal');
const checkoutModal = document.getElementById('checkoutModal');
const returnModal = document.getElementById('returnModal');

// Form Elements
const addItemForm = document.getElementById('addItemForm');
const checkoutForm = document.getElementById('checkoutForm');
const returnForm = document.getElementById('returnForm');

// Initialize Data
let inventory = [];
let transactions = [];

// Fetch Inventory Data
function fetchInventory() {
    db.collection('inventory').get()
        .then(snapshot => {
            inventory = [];
            snapshot.forEach(doc => {
                inventory.push({ id: doc.id, ...doc.data() });
            });
            renderInventoryTable();
        })
        .catch(error => {
            console.error("Error fetching inventory:", error);
        });
}

// Fetch Transactions
function fetchTransactions() {
    db.collection('transactions')
        .where('status', '==', 'Checked Out')
        .get()
        .then(snapshot => {
            transactions = [];
            snapshot.forEach(doc => {
                transactions.push({ id: doc.id, ...doc.data() });
            });
        })
        .catch(error => {
            console.error("Error fetching transactions:", error);
        });
}

// Render Inventory Table
function renderInventoryTable(filter = '') {
    inventoryTableBody.innerHTML = '';
    
    const filteredItems = inventory.filter(item => 
        item.name.toLowerCase().includes(filter.toLowerCase()) ||
        item.category.toLowerCase().includes(filter.toLowerCase()) ||
        item.id.toLowerCase().includes(filter.toLowerCase())
    );
    
    filteredItems.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity} ${item.unit || 'units'}</td>
            <td><span class="status status-${item.status === 'Available' ? 'available' : 'checkedout'}">${item.status}</span></td>
            <td>
                <button class="action-btn ${item.status === 'Available' ? 'checkout' : 'return'}" 
                        data-id="${item.id}" 
                        data-name="${item.name}"
                        data-quantity="${item.quantity}"
                        data-status="${item.status}">
                    ${item.status === 'Available' ? 'Check Out' : 'Return'}
                </button>
            </td>
        `;
        
        inventoryTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.action-btn.checkout').forEach(btn => {
        btn.addEventListener('click', () => openCheckoutModal(btn.dataset));
    });
    
    document.querySelectorAll('.action-btn.return').forEach(btn => {
        btn.addEventListener('click', () => openReturnModal(btn.dataset));
    });
}

// Search Functionality
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderInventoryTable(e.target.value);
    });
}

// Add Item Modal
if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
        addItemModal.style.display = 'flex';
    });
}

document.getElementById('closeAddModal').addEventListener('click', () => {
    addItemModal.style.display = 'none';
});

document.getElementById('cancelAddBtn').addEventListener('click', () => {
    addItemModal.style.display = 'none';
});

// Save New Item
document.getElementById('saveItemBtn').addEventListener('click', () => {
    const itemName = document.getElementById('itemName').value;
    const itemCategory = document.getElementById('itemCategory').value;
    const itemQuantity = parseInt(document.getElementById('itemQuantity').value);
    const itemDescription = document.getElementById('itemDescription').value;
    
    if (!itemName || !itemCategory || !itemQuantity) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Generate item ID
    const itemId = 'ITEM-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    db.collection('inventory').doc(itemId).set({
        name: itemName,
        category: itemCategory,
        quantity: itemQuantity,
        description: itemDescription,
        status: 'Available',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Item added successfully!');
        addItemForm.reset();
        addItemModal.style.display = 'none';
        fetchInventory();
    })
    .catch(error => {
        console.error("Error adding item:", error);
        alert('Error adding item. Please try again.');
    });
});

// Check Out Modal
function openCheckoutModal(itemData) {
    document.getElementById('checkoutItem').value = itemData.id;
    document.getElementById('checkoutQuantity').max = itemData.quantity;
    checkoutModal.style.display = 'flex';
}

document.getElementById('closeCheckoutModal').addEventListener('click', () => {
    checkoutModal.style.display = 'none';
});

document.getElementById('cancelCheckoutBtn').addEventListener('click', () => {
    checkoutModal.style.display = 'none';
});

// Confirm Check Out
document.getElementById('confirmCheckoutBtn').addEventListener('click', () => {
    const itemId = document.getElementById('checkoutItem').value;
    const quantity = parseInt(document.getElementById('checkoutQuantity').value);
    const person = document.getElementById('checkoutPerson').value;
    const task = document.getElementById('checkoutTask').value;
    const date = document.getElementById('checkoutDate').value || new Date().toISOString().split('T')[0];
    
    if (!itemId || !quantity || !person || !task) {
        alert('Please fill in all required fields');
        return;
    }
    
    const item = inventory.find(i => i.id === itemId);
    
    if (quantity > item.quantity) {
        alert('Cannot check out more than available quantity');
        return;
    }
    
    const jobId = generateJobId();
    
    // Create transaction
    db.collection('transactions').doc(jobId).set({
        itemId: itemId,
        itemName: item.name,
        quantity: quantity,
        person: person,
        task: task,
        dateIssued: firebase.firestore.Timestamp.fromDate(new Date(date)),
        status: 'Checked Out',
        unit: item.unit || 'units'
    })
    .then(() => {
        // Update inventory
        const newQuantity = item.quantity - quantity;
        const newStatus = newQuantity === 0 ? 'Out of Stock' : 'Checked Out';
        
        return db.collection('inventory').doc(itemId).update({
            quantity: newQuantity,
            status: newStatus
        });
    })
    .then(() => {
        alert('Item checked out successfully!');
        checkoutForm.reset();
        checkoutModal.style.display = 'none';
        fetchInventory();
        fetchTransactions();
    })
    .catch(error => {
        console.error("Error checking out item:", error);
        alert('Error checking out item. Please try again.');
    });
});

// Return Modal
function openReturnModal(itemData) {
    const checkoutSelect = document.getElementById('returnTransaction');
    checkoutSelect.innerHTML = '<option value="">Select Transaction</option>';
    
    transactions
        .filter(t => t.itemId === itemData.id && t.status === 'Checked Out')
        .forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = `${t.id} - ${t.person} (${t.quantity} ${t.unit || 'units'})`;
            checkoutSelect.appendChild(option);
        });
    
    returnModal.style.display = 'flex';
}

document.getElementById('closeReturnModal').addEventListener('click', () => {
    returnModal.style.display = 'none';
});

document.getElementById('cancelReturnBtn').addEventListener('click', () => {
    returnModal.style.display = 'none';
});

// Confirm Return
document.getElementById('confirmReturnBtn').addEventListener('click', () => {
    const transactionId = document.getElementById('returnTransaction').value;
    const quantity = parseInt(document.getElementById('returnQuantity').value);
    const condition = document.getElementById('returnCondition').value;
    const notes = document.getElementById('returnNotes').value;
    
    if (!transactionId || !quantity) {
        alert('Please fill in all required fields');
        return;
    }
    
    const transaction = transactions.find(t => t.id === transactionId);
    const item = inventory.find(i => i.id === transaction.itemId);
    
    if (quantity > transaction.quantity) {
        alert('Cannot return more than checked out quantity');
        return;
    }
    
    // Update transaction
    db.collection('transactions').doc(transactionId).update({
        quantityReturned: quantity,
        returnCondition: condition,
        returnNotes: notes,
        dateReturned: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'Returned'
    })
    .then(() => {
        // Update inventory
        const newQuantity = item.quantity + quantity;
        const newStatus = newQuantity > 0 ? 'Available' : item.status;
        
        return db.collection('inventory').doc(item.id).update({
            quantity: newQuantity,
            status: newStatus
        });
    })
    .then(() => {
        alert('Item returned successfully!');
        returnForm.reset();
        returnModal.style.display = 'none';
        fetchInventory();
        fetchTransactions();
    })
    .catch(error => {
        console.error("Error returning item:", error);
        alert('Error returning item. Please try again.');
    });
});

// Initialize Inventory Page
if (window.location.pathname.includes('inventory.html')) {
    fetchInventory();
    fetchTransactions();
}