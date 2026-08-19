import apiClient from "../../lib/apiClient.js";


export const listLoans = () => apiClient.get("/loans");

export const getLoan = (loanId) => apiClient.get(`/loans/${loanId}`);

export const applyForLoan = (payload) => apiClient.post("/loans/apply", payload);

export const addGuarantor = (loanId, payload) => apiClient.post(`/loans/${loanId}/guarantors`, payload);

export const respondToGuarantee = (loanId, decision) => apiClient.post(`/loans/${loanId}/guarantors/${decision}`);

export const disburseLoan = (loanId) => apiClient.post(`/loans/${loanId}/disburse`);