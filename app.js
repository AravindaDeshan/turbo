// DOM Elements
const totalItemsElement = document.getElementById('totalItems');
const checkedOutItemsElement = document.getElementById('checkedOutItems');
const pendingReturnsElement = document.getElementById('pendingReturns');
const activityList = document.getElementById('activityList');

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
            updateDashboard();
        })
        .catch(error => {
            console.error("Error fetching inventory:", error);
        });
}

// Fetch Transactions
function fetchTransactions() {
    db.collection('transactions')
        .orderBy('dateIssued', 'desc')
        .limit(5)
        .get()
        .then(snapshot => {
            transactions = [];
            snapshot.forEach(doc => {
                transactions.push({ id: doc.id, ...doc.data() });
            });
            updateDashboard();
        })
        .catch(error => {
            console.error("Error fetching transactions:", error);
        });
}

// Update Dashboard
function updateDashboard() {
    // Update inventory counts
    if (totalItemsElement) {
        totalItemsElement.textContent = inventory.length;
    }
    
    if (checkedOutItemsElement) {
        const checkedOut = inventory.filter(item => item.status === 'Checked Out').length;
        checkedOutItemsElement.textContent = checkedOut;
    }
    
    if (pendingReturnsElement) {
        const pending = transactions.filter(t => t.status === 'Checked Out').length;
        pendingReturnsElement.textContent = pending;
    }
    
    // Update activity list
    if (activityList) {
        activityList.innerHTML = '';
        transactions.forEach(transaction => {
            const activityItem = document.createElement('li');
            activityItem.className = 'activity-item';
            
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-${transaction.status === 'Checked Out' ? 'external-link-alt' : 'undo'}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${transaction.itemName} ${transaction.status === 'Checked Out' ? 'checked out' : 'returned'}</div>
                    <div class="activity-time">${new Date(transaction.dateIssued.seconds * 1000).toLocaleString()}</div>
                </div>
                <div class="activity-amount">${transaction.quantity} ${transaction.unit || 'units'}</div>
            `;
            
            activityList.appendChild(activityItem);
        });
    }
}

// Generate Job ID
function generateJobId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `JOB-${result}`;
}

// Initialize Dashboard
if (window.location.pathname.includes('dashboard.html')) {
    fetchInventory();
    fetchTransactions();
}