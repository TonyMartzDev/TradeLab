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
  function generateTable(trades) {
    const tableBody = document.querySelector("#tradesTable tbody");
    tableBody.innerHTML = "";
    trades.forEach((trade) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${trade.date}</td>
      <td>${trade.symbol}</td>
      <td>${trade.direction}</td>
      <td>${trade.market}</td>
      <td>${trade.entryPrice}</td>
      <td>${trade.exitPrice}</td>
      <td>${trade.quantity}</td>
      <td>${trade.investment}</td>
      <td>${trade.pnl}</td>
      <td>${trade.roi}</td>
      <td>${trade.notes}</td>
      <td><button class="edit-button" data-id="${trade.id}">Edit</button>
      <button class="delete-button" data-id="${trade.id}">Delete</button></td>
      `;
      tableBody.appendChild(row);
    });
  }

  generateTable(window.tradeManager.trades);

});
