document.addEventListener("DOMContentLoaded", async function () {
  // Get modal elements
  const editModal = document.getElementById("editTradeModal");
  const closeBtn = document.querySelector(".close");
  const cancelBtn = document.getElementById("cancelEdit");
  const editForm = document.getElementById("editTradeForm");

  // Edit Form fields
  const editTradeId = document.getElementById("editTradeId");
  const editDate = document.getElementById("editDate");
  const editSymbol = document.getElementById("editSymbol");
  const editDirection = document.getElementById("editDirection");
  const editMarket = document.getElementById("editMarket");
  const editEntryPrice = document.getElementById("editEntryPrice");
  const editExitPrice = document.getElementById("editExitPrice");
  const editQuantity = document.getElementById("editQuantity");
  const editNotes = document.getElementById("editNotes");

  // Form fields
  const entryPrice = document.getElementById("entryPrice");
  const exitPrice = document.getElementById("exitPrice");
  const quantity = document.getElementById("quantity");

  // Helper functions
  function formatDate(dateString) {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0); // Ensure no time components
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Function to open modal and populate with trade data
  function openEditModal(trade) {
    editTradeId.value = trade.id;
    // For date input, use the date portion only
    const tradeDate = new date(trade.date);
    editDate.value = tradeDate.toISOString().split("T")[0];
    tradeDate.setHours(0, 0, 0, 0);
    editSymbol.value = trade.symbol.toUpperCase();
    editDirection.value = trade.direction;
    editMarket.value = trade.market;
    editEntryPrice.value = trade.entryPrice;
    editExitPrice.value = trade.exitPrice;
    editQuantity.value = trade.quantity;
    editNotes.value = trade.notes || "";
    editModal.style.display = "block";
  }

  // Function to close modal
  function closeEditModal() {
    editModal.style.display = "none";
    editForm.reset();
  }

  // Close modal when clicking close button or cancel
  closeBtn.onclick = closeEditModal;
  cancelBtn.onclick = closeEditModal;

  // Close modal when clicking outside of it
  window.onclick = function (event) {
    if (event.target === editModal) {
      closeEditModal();
    }
  };

  // Handle form submission
  editForm.onsubmit = async function (event) {
    event.preventDefault();
    const updatedTrade = new Trade(
      editSymbol.value,
      editDirection.value,
      editMarket.value,
      editEntryPrice.value,
      editExitPrice.value,
      editQuantity.value,
      editNotes.value,
      editDate.value
    );
    updatedTrade.id = editTradeId.value;

    try {
      const index = window.tradeManager.trades.findIndex(
        (t) => t.id === updatedTrade.id
      );

      if (index !== -1) {
        window.tradeManager.trades[index] = updatedTrade;
        await window.tradeManager.saveTrades();
        window.tradeManager.displayTrades(window.tradeManager.trades);
        closeModal();
        showNotification("Trade updated successfully!", "success");
      }
    } catch (error) {
      console.error("Error updating trade:", error);
      showNotification("Error updating trade. Please try again.", "error");
    }
  };

  // Trade form data validation
  editForm.addEventListener("submit", function (event) {
    event.preventDefault();
    validateForm();
  });

  const tradeForm = document.querySelector(".trade-form");
  var pristine = new Pristine(tradeForm);

  // Validate form fields
  const numericInputs = [entryPrice, exitPrice, quantity];
  
  function validateNumericInput(input) {
    // Remove any non-numeric characters except decimal point
    const value = input.value.trim();
    // Check if empty
    if (value === "") {
      return false;
    }
    // Use a regex to check if it's a valid number (integer or decimal)
    const isValid = /^\d*\.?\d+$/.test(value);
    return isValid && !isNaN(parseFloat(value));
  }

  function updateInputValidation(input) {
    const isValid = validateNumericInput(input);
    input.classList.remove("is-valid", "success", "error");
    if (isValid) {
      input.classList.add("is-valid", "success");
    } else {
      input.classList.add("error");
    }
    return isValid;
  }

  numericInputs.forEach((input) => {
    // Validate on input
    input.addEventListener("input", () => {
      updateInputValidation(input);
    });

    // Maintain validation state on blur
    input.addEventListener("blur", () => {
      updateInputValidation(input);
    });

    // Initial validation state
    if (input.value) {
      updateInputValidation(input);
    }
  });
  function validateForm() {
    // validation of trade data using pristine.js
    var validate = pristine.validate();

    if (validate) {
      submitForm();
    }
  }

  function submitForm() {
    tradeForm.submit();
    pristine.destroy();
  }

  // Recent trades table
  function safeValue(value, type = 'text') {
    if (value === null || value === undefined) return '-';
    switch(type) {
      case 'currency':
        return typeof value === 'number' ? 
          value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-';
      case 'percentage':
        return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : '-';
      case 'number':
        return typeof value === 'number' ? value.toFixed(2) : '-';
      default:
        return value.toString();
    }
  }

  // Custom confirmation dialog
  const confirmDialog = document.getElementById('confirmDialog');
  const closeConfirm = document.querySelector('.close-confirm');
  const confirmCancel = document.getElementById('confirmCancel');
  const confirmOk = document.getElementById('confirmOk');
  const confirmMessage = document.getElementById('confirmMessage');
  
  function showConfirmDialog(message) {
    return new Promise((resolve) => {
      confirmMessage.textContent = message;
      confirmDialog.style.display = 'block';

      function handleConfirm() {
        confirmDialog.style.display = 'none';
        cleanup();
        resolve(true);
      }

      function handleCancel() {
        confirmDialog.style.display = 'none';
        cleanup();
        resolve(false);
      }

      function handleClickOutside(event) {
        if (event.target === confirmDialog) {
          handleCancel();
        }
      }

      function cleanup() {
        confirmOk.removeEventListener('click', handleConfirm);
        confirmCancel.removeEventListener('click', handleCancel);
        closeConfirm.removeEventListener('click', handleCancel);
        window.removeEventListener('click', handleClickOutside);
      }

      confirmOk.addEventListener('click', handleConfirm);
      confirmCancel.addEventListener('click', handleCancel);
      closeConfirm.addEventListener('click', handleCancel);
      window.addEventListener('click', handleClickOutside);
    });
  }

  async function deleteTrade(tradeId) {
    const confirmed = await showConfirmDialog('Are you sure you want to delete this trade?');
    if (confirmed) {
      try {
        await window.tradeAPI.deleteTrade(tradeId);
        await loadRecentTrades();
        showNotification('Trade deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting trade:', error);
        showNotification(error.message || 'Error deleting trade. Please try again.', 'error');
      }
    }
  }

  async function loadRecentTrades() {
    try {
      const trades = await window.tradeAPI.getRecentTrades();
      generateTable(trades);
    } catch (error) {
      console.error('Error loading trades:', error);
      showNotification(error.message || 'Error loading trades. Please try again.', 'error');
    }
  }

  function generateTable(trades) {
    const tableBody = document.querySelector("#tradesTable tbody");
    if (!tableBody) {
      console.error('Table body element not found');
      return;
    }

    tableBody.innerHTML = "";
    
    // Get the 10 most recent trades
    const recentTrades = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    
    recentTrades.forEach((trade) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatDate(trade.date)}</td>
        <td>${safeValue(trade.symbol)}</td>
        <td>${safeValue(trade.direction)}</td>
        <td>${safeValue(trade.market)}</td>
        <td>${safeValue(trade.entryPrice, 'number')}</td>
        <td>${safeValue(trade.exitPrice, 'number')}</td>
        <td>${safeValue(trade.quantity, 'number')}</td>
        <td>${safeValue(trade.investment, 'currency')}</td>
        <td>${safeValue(trade.pnl, 'currency')}</td>
        <td>${safeValue(trade.roi, 'percentage')}</td>
        <td>${safeValue(trade.notes)}</td>
        <td>
          <button class="edit-button" data-id="${trade.id}">Edit</button>
          <button class="delete-button" data-id="${trade.id}">Delete</button>
        </td>
      `;

      // Add event listeners to buttons
      const editBtn = row.querySelector('.edit-button');
      const deleteBtn = row.querySelector('.delete-button');
      
      if (editBtn) editBtn.addEventListener('click', () => openEditModal(trade));
      if (deleteBtn) deleteBtn.addEventListener('click', () => deleteTrade(trade.id));

      tableBody.appendChild(row);
    });
  }

  // Load initial trades
  loadRecentTrades();

});
