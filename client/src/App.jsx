import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import {
  lENDINGANDBORROWINGABI,
  lENDINGANDBORROWINGADDRESS,
} from "./abi/constants"; // Replace with your actual ABI file path
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "react-hot-toast";
import "./App.css";

const App = () => {
  const [subscriptionFee, setSubscriptionFee] = useState(15);

  // UI state management
  const [activeTab, setActiveTab] = useState("borrower"); // borrower, lender, admin
  const [borrowerData, setBorrowerData] = useState({});
  const [lenderData, setLenderData] = useState({});

  // Borrower-specific states
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState("");

  // Lender-specific states
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Admin-specific states
  const [blockAddress, setBlockAddress] = useState("");
  const [unblockAddress, setUnblockAddress] = useState("");
  const [newBorrowLimit, setNewBorrowLimit] = useState("");

  //get details
  const [borrowerDetails, setBorrowerDetails] = useState({});
  const [lenderDetails, setLenderDetails] = useState({});
  const [lenderAddress, setLenderAddress] = useState("");
  const [borrowerAddress, setBorrowerAddress] = useState("");

  const { writeContractAsync, isPending } = useWriteContract();
  const { address } = useAccount();

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleInputChange = (e, setState) => {
    let value = e.target.value;

    // Allow empty input for clearing
    if (value === "") {
      setState(value);
      return;
    }

    // Regular expression to allow positive decimals and integers (greater than 0)
    if (/^(\d+(\.\d{0,18})?|0\.\d{0,18})$/.test(value)) {
      setState(value);
    }
  };

  //reading lenders and borrowers details

  const { data: lenderInfo, isError: lenderError } = useReadContract({
    address: lENDINGANDBORROWINGADDRESS,
    abi: lENDINGANDBORROWINGABI,
    functionName: "getLenderDetails",
    args: [address],
  });

  const { data: borrowingInfo, isError: borrowerError } = useReadContract({
    address: lENDINGANDBORROWINGADDRESS,
    abi: lENDINGANDBORROWINGABI,
    functionName: "getBorrowerDetails",
    args: [address],
  });

  console.log(borrowingInfo);
  // Borrower functions

  const renewSubscription = async () => {
    try {
      // Call the renewSubscription function from the smart contract
      const transaction = await writeContractAsync({
        address: lENDINGANDBORROWINGADDRESS,
        abi: lENDINGANDBORROWINGABI,
        functionName: "renewSubscription",
        args: [],
        value: ethers.parseEther(subscriptionFee), // Pass the subscription fee in wei
      });

      console.log(transaction);

      // Success message
      toast.success("Subscription renewed successfully!");
    } catch (error) {
      console.error(error);

      // Handle specific errors from the smart contract

      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (error.message.includes("Incorrect subscription fee")) {
        toast.error("Transaction failed: Incorrect subscription fee.");
      } else if (error.message.includes("revert")) {
        toast.error("Transaction failed: Contract reverted. Please try again.");
      } else {
        // For all other errors
        toast.error(`Subscription renewal failed: ${error.message || error}`);
      }
    }
  };

  const borrowFunds = async () => {
    try {
      // Check if the borrow amount is valid
      if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
        toast.error("Borrow amount must be greater than zero.");
        return;
      }

      // Call the borrow function from the smart contract
      const transaction = await writeContractAsync({
        address: lENDINGANDBORROWINGADDRESS,
        abi: lENDINGANDBORROWINGABI,
        functionName: "borrow",
        args: [ethers.parseEther(borrowAmount)], // Convert borrowAmount to wei
      });

      console.log(transaction);

      // Success message
      toast.success("Funds borrowed successfully!");
    } catch (error) {
      console.error(error);

      // Handle specific errors from the smart contract

      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (error.message.includes("Amount must be greater than zero")) {
        toast.error("Transaction failed: Amount must be greater than zero.");
      } else if (error.message.includes("Exceeds fixed borrowing limit")) {
        toast.error("Transaction failed: Exceeds the fixed borrowing limit.");
      } else if (error.message.includes("Insufficient funds in lending pool")) {
        toast.error(
          "Transaction failed: Insufficient funds in the lending pool."
        );
      } else if (error.message.includes("revert")) {
        toast.error("Transaction failed: Contract reverted. Please try again.");
      } else {
        // For all other errors
        toast.error(`Borrowing failed: ${error.message || error}`);
      }
    }
  };

  const repayLoan = async () => {
    try {
      // Check if repayment amount is valid
      if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
        toast.error("Repayment amount must be greater than zero.");
        return;
      }

      // Call the repay function from the smart contract
      const transaction = await writeContractAsync({
        address: lENDINGANDBORROWINGADDRESS,
        abi: lENDINGANDBORROWINGABI,
        functionName: "repay",
        args: [],
        value: ethers.parseEther(repaymentAmount),
      });

      console.log(transaction);

      // Success message
      toast.success("Loan repaid successfully!");
    } catch (error) {
      console.error(error);

      // Handle specific errors from the smart contract

      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (
        error.message.includes("Repayment amount must be greater than zero")
      ) {
        toast.error(
          "Transaction failed: Repayment amount must be greater than zero."
        );
      } else if (error.message.includes("No active loans to repay")) {
        toast.error("Transaction failed: No active loans to repay.");
      } else if (error.message.includes("Insufficient repayment amount")) {
        toast.error("Transaction failed: Insufficient repayment amount.");
      } else if (error.message.includes("revert")) {
        toast.error("Transaction failed: Contract reverted. Please try again.");
      } else if (error.message.includes("Penalty")) {
        toast.error(
          "Transaction failed: Penalty and interest calculation error."
        );
      } else {
        // For all other errors
        toast.error(`Repayment failed: ${error.message || error}`);
      }
    }
  };

  // Lender functions
  const depositFunds = async (e) => {
    e.preventDefault();

    try {
      // Check if deposit amount is valid
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        toast.error("Deposit amount must be greater than zero");
        return;
      }
      console.log(depositAmount);

      // Prepare the deposit transaction
      const depositValue = ethers.parseEther(depositAmount); // Convert depositAmount to wei

      // Send the deposit transaction to the contract
      const transaction = await writeContractAsync({
        address: lENDINGANDBORROWINGADDRESS,
        abi: lENDINGANDBORROWINGABI,
        functionName: "deposit",
        args: [],
        value: depositValue, // Value to send with the transaction
      });

      console.log(transaction);

      // Success message on successful transaction
      toast.success("Funds deposited successfully!");
    } catch (error) {
      // Handle common errors from the contract call
      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (
        error.message.includes("Deposit amount must be greater than zero")
      ) {
        toast.error("Deposit amount must be greater than zero.");
      } else if (error.message.includes("revert")) {
        toast.error("Transaction failed: Contract reverted. Please try again.");
      } else {
        // For all other errors
        console.error(error);
        toast.error(`Deposit failed: ${error.message || error}`);
      }
    }
  };

  const withdrawFunds = async (e) => {
    e.preventDefault();
    try {
      // Ensure withdrawal amount is valid
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        alert("Withdrawal amount must be greater than zero");
        return;
      }

      // Convert withdrawal amount to Wei
      const withdrawValue = ethers.parseEther(withdrawAmount);

      // Send withdrawal transaction to contract
      console.log(withdrawAmount);

      // Send the withdrawn transaction to the contract
      const transaction = await writeContractAsync({
        address: lENDINGANDBORROWINGADDRESS,
        abi: lENDINGANDBORROWINGABI,
        functionName: "withdraw",
        args: [withdrawValue],
      });

      console.log(transaction);

      // Success message on successful transaction
      toast.success("Funds withdrawn successfully!");

      alert("Funds withdrawn successfully!");
    } catch (error) {
      // Handle specific errors based on contract revert messages
      if (error.message.includes("Withdraw amount must be greater than zero")) {
        alert("Withdrawal failed: Amount must be greater than zero.");
      } else if (
        error.message.includes("Insufficient funds in lender balance")
      ) {
        alert("Withdrawal failed: Insufficient funds in your balance.");
      } else if (error.message.includes("Insufficient funds in lending pool")) {
        alert("Withdrawal failed: Insufficient funds in the lending pool.");
      } else if (error.message.includes("revert")) {
        alert("Withdrawal failed: Transaction reverted. Please try again.");
      } else {
        // Handle other unknown errors
        console.error(error);
        alert("Withdrawal failed: " + error.message);
      }
    }
  };

  const claimRewards = async (e) => {
    e.preventDefault();

    try {
      // Call the claimRewards function from the smart contract
      const transaction = await writeContractAsync({
        address: lENDINGANDBORROWINGADDRESS,
        abi: lENDINGANDBORROWINGABI,
        functionName: "claimRewards",
        args: [],
      });

      console.log(transaction);
      // Success message on successful transaction
      toast.success("Rewards claimed successfully!");

      // Alert the user if the rewards were claimed successfully
      alert("Rewards claimed successfully!");
    } catch (error) {
      // Handle specific error: No rewards to claim
      if (error.message.includes("No rewards to claim")) {
        alert("Claiming rewards failed: No rewards available.");
      } else if (error.message.includes("revert")) {
        // General revert error handling for unexpected contract failures
        alert(
          "Claiming rewards failed: Transaction reverted. Please try again."
        );
      } else {
        // Handle any other unexpected errors
        console.error(error);
        alert("Claiming rewards failed: " + error.message);
      }
    }
  };

  // Admin functions
  const blockBorrower = async () => {
    try {
      // Call the blockBorrower function from the smart contract
      const transaction = await writeContractAsync({
        address: lENDINGANDBORROWINGADDRESS,
        abi: lENDINGANDBORROWINGABI,
        functionName: "blockBorrower",
        args: [blockAddress],
      });

      // Success message using React Toast
      toast.success("Borrower blocked successfully!");
    } catch (error) {
      // Handle specific error: Only owner can call the function
      if (error.message.includes("Ownable: caller is not the owner")) {
        toast.error("Blocking failed: You are not the owner of the contract.");
      } else if (error.message.includes("revert")) {
        // General revert error handling for unexpected contract failures
        toast.error("Blocking failed: Transaction reverted. Please try again.");
      } else {
        // Handle any other unexpected errors
        console.error(error);
        toast.error(`Blocking failed: ${error.message}`);
      }
    }
  };

  const unblockBorrower = async () => {
    try {
      // Call the unblockBorrower function from the smart contract
      const transaction = await writeContractAsync({
        address: lENDINGANDBORROWINGADDRESS,
        abi: lENDINGANDBORROWINGABI,
        functionName: "unblockBorrower",
        args: [unblockAddress],
      });

      console.log(transaction);

      // Success message
      toast.success("Borrower unblocked successfully!");
    } catch (error) {
      console.error(error);

      // Handle specific errors from the smart contract

      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (error.message.includes("onlyOwner")) {
        toast.error("Only the owner can unblock the borrower.");
      } else if (error.message.includes("revert")) {
        toast.error("Transaction failed: Contract reverted. Please try again.");
      } else {
        // For all other errors
        toast.error(`Unblocking failed: ${error.message || error}`);
      }
    }
  };

  const setBorrowLimit = async () => {
    try {
      // Call the setFixedBorrowingLimit function from the smart contract
      const transaction = await writeContractAsync({
        address: lENDINGANDBORROWINGADDRESS,
        abi: lENDINGANDBORROWINGABI,
        functionName: "setFixedBorrowingLimit",
        args: [ethers.parseEther(newBorrowLimit)], // Convert to wei
      });

      console.log(transaction);

      // Success message
      toast.success("Borrow limit updated successfully!");
    } catch (error) {
      console.error(error);

      // Handle specific errors from the smart contract

      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (error.message.includes("onlyOwner")) {
        toast.error("Only the owner can update the borrow limit.");
      } else if (error.message.includes("revert")) {
        toast.error("Transaction failed: Contract reverted. Please try again.");
      } else {
        // For all other errors
        toast.error(`Updating borrow limit failed: ${error.message || error}`);
      }
    }
  };

  //get details
  useEffect(() => {
    const getBorrowerDetails = async () => {
      try {
        // Log the borrowingInfo when it changes
        console.log("borrowingInfo:", borrowingInfo);

        // Check if borrowerError exists and throw an error if true
        if (borrowerError) {
          throw new Error("Borrower details not available");
        }

        // Check if borrowingInfo is available and valid (should be an array of length 4)
        if (!borrowingInfo || borrowingInfo.length !== 4) {
          throw new Error("Unexpected data format returned from the contract");
        }

        // Destructure the borrower details
        const [borrowedAmount, penalty, dailyInterest, totalOwed] =
          borrowingInfo;

        // Ensure that the data is in the expected format (bigint)
        if (
          typeof borrowedAmount !== "bigint" ||
          typeof penalty !== "bigint" ||
          typeof dailyInterest !== "bigint" ||
          typeof totalOwed !== "bigint"
        ) {
          throw new Error("Invalid data format returned from the contract");
        }

        // Format the values for display
        const formattedDetails = {
          borrowedAmount: ethers.formatEther(borrowedAmount), // Ensure correct conversion
          penalty: ethers.formatEther(penalty), // Ensure correct conversion
          dailyInterest: ethers.formatEther(dailyInterest), // Ensure correct conversion
          totalOwed: ethers.formatEther(totalOwed), // Ensure correct conversion
        };

        // Update state with the fetched and formatted details
        setBorrowerDetails(formattedDetails);

        // Show success toast
        toast.success("Borrower details fetched successfully");
      } catch (error) {
        // Log and show error messages
        console.error("Unexpected error:", error);
        toast.error("Failed to fetch borrower details");
      }
    };

    // If borrowingInfo changes and is available, fetch borrower details
    if (borrowingInfo) {
      getBorrowerDetails();
    }
  }, [borrowingInfo, borrowerError]);

  useEffect(() => {
    const getLenderDetails = async () => {
      try {
        // Log the lenderInfo when it changes
        console.log("lenderInfo:", lenderInfo);

        // Check if lenderInfo is available and valid (i.e., it should be an array of length 3)
        if (lenderError) {
          throw new Error("Lender details not available");
        }

        // Destructure the lender details
        const [depositedAmount, rewards, lastInterestClaimedAt] = lenderInfo;

        // Ensure that the data is in the expected format
        if (
          typeof depositedAmount !== "bigint" ||
          typeof rewards !== "bigint" ||
          typeof lastInterestClaimedAt !== "bigint"
        ) {
          throw new Error("Invalid data format returned from the contract");
        }

        // Format the values for display
        const formattedDetails = {
          depositedAmount: ethers.formatEther(depositedAmount), // Ensure correct conversion
          rewards: ethers.formatEther(rewards), // Ensure correct conversion
          lastInterestClaimedAt: new Date(
            Number(lastInterestClaimedAt) * 1000
          ).toLocaleString(),
        };

        // Update state with the fetched details
        setLenderDetails(formattedDetails);

        // Show success toast
        toast.success("Lender details fetched successfully");
      } catch (error) {
        // Log and show error messages
        console.error("Unexpected error:", error);
        toast.error("Failed to fetch lender details");
      }
    };

    if (lenderInfo) {
      getLenderDetails();
    }
  }, [lenderInfo, lenderError]); // This will trigger the effect when lenderInfo changes

  return (
    <div className="App">
      <h1>BorrowEase Protocol</h1>
      <div style={{ marginBottom: "15px" }}>
        <ConnectButton />
      </div>

      <div className="tabs">
        <button
          onClick={() => handleTabChange("borrower")}
          disabled={activeTab === "borrower"}
        >
          Borrower
        </button>
        <button
          onClick={() => handleTabChange("lender")}
          disabled={activeTab === "lender"}
        >
          Lender
        </button>
        <button
          onClick={() => handleTabChange("admin")}
          disabled={activeTab === "admin"}
        >
          Admin
        </button>
      </div>

      <div className="content">
        {activeTab === "borrower" && (
          <div>
            <h2>Borrower Dashboard</h2>
            <button onClick={renewSubscription}>
              Renew Subscription ({subscriptionFee} XFI)
            </button>
            <div>
              <input
                type="number"
                placeholder="Borrow Amount (XFI)"
                value={borrowAmount}
                onChange={(e) => handleInputChange(e, setBorrowAmount)}
              />
              <button onClick={borrowFunds}>Borrow Funds</button>
            </div>
            <div>
              <input
                type="number"
                placeholder="Repayment Amount (XFI)"
                value={repaymentAmount}
                onChange={(e) => handleInputChange(e, setRepaymentAmount)}
              />
              <button onClick={repayLoan}>Repay Loan</button>
            </div>
            <div>
              <div className="details-section borrower-details">
                {borrowerDetails && (
                  <div>
                    <h3>Borrower Details:</h3>
                    <p>Borrowed Amount: {borrowerDetails.borrowedAmount} XFI</p>
                    <p>Penalty: {borrowerDetails.penalty} XFI</p>
                    <p>Daily Interest: {borrowerDetails.dailyInterest} XFI</p>
                    <p>Total Owed: {borrowerDetails.totalOwed} XFI</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "lender" && (
          <div>
            <h2>Lender Dashboard</h2>
            <div>
              <input
                type="number"
                placeholder="Deposit Amount (XFI)"
                value={depositAmount}
                onChange={(e) => handleInputChange(e, setDepositAmount)}
              />
              <button onClick={depositFunds}>Deposit Funds</button>
            </div>
            <div>
              <input
                type="number"
                placeholder="Withdraw Amount (XFI)"
                value={withdrawAmount}
                onChange={(e) => handleInputChange(e, setWithdrawAmount)}
              />
              <button onClick={withdrawFunds}>Withdraw Funds</button>
            </div>
            <button onClick={claimRewards}>Claim Rewards</button>
            <div>
              <div className="details-section lender-details">
                {lenderDetails && lenderDetails.depositedAmount && (
                  <div>
                    <h3>Lender Details:</h3>
                    <p>Deposited Amount: {lenderDetails.depositedAmount} XFI</p>
                    <p>Rewards: {lenderDetails.rewards} XFI</p>
                    <p>
                      Last Interest Claimed At:{" "}
                      {lenderDetails.lastInterestClaimedAt}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            <h2>Admin Dashboard</h2>
            <div>
              <input
                type="text"
                placeholder="Borrower Address to Block"
                value={blockAddress}
                onChange={(e) => setBlockAddress(e.target.value)}
              />
              <button onClick={blockBorrower}>Block Borrower</button>
            </div>
            <div>
              <input
                type="text"
                placeholder="Borrower Address to Unblock"
                value={unblockAddress}
                onChange={(e) => setUnblockAddress(e.target.value)}
              />
              <button onClick={unblockBorrower}>Unblock Borrower</button>
            </div>
            <div>
              <input
                type="number"
                placeholder="New Borrow Limit (XFI)"
                value={newBorrowLimit}
                onChange={(e) => handleInputChange(e, setNewBorrowLimit)}
              />
              <button onClick={setBorrowLimit}>Set Borrow Limit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
