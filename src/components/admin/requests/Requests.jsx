import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function Requests() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sellerDetails, setSellerDetails] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/request/getAllRequests`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = response.data;

      const pending = data.requests?.filter((req) => req.status === 'pending') || [];
      const history =
        data.requests?.filter(
          (req) => req.status === 'accepted' || req.status === 'rejected'
        ) || [];

      setPendingRequests(pending);
      setRequestHistory(history);

      const sellerIds = [...new Set(data.requests?.map((req) => req.sellerId))];
      await fetchSellerDetails(sellerIds);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerDetails = async (sellerIds) => {
    try {
      const details = {};
      for (const sellerId of sellerIds) {
        const response = await axios.get(`${API_URL}/user/users/${sellerId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        // console.log('Seller details response:', response);
        details[sellerId] = response.data;
        console.log('Fetched seller details:', details);
      }
      setSellerDetails(details);
    } catch (err) {
      console.error('Error fetching seller details:', err);
    }
  };

  const openRequestModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setError('');
    setSuccess('');
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch(
        `${API_URL}/request/requests/${selectedRequest._id}/accept`,
        { quantity: selectedRequest.quantity },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setSuccess('Request accepted and stock updated successfully');
      setTimeout(() => {
        closeModal();
        fetchRequests();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to accept request');
      console.error('Error accepting request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch(
        `${API_URL}/request/requests/${selectedRequest._id}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setSuccess('Request rejected successfully');
      setTimeout(() => {
        closeModal();
        fetchRequests();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to reject request');
      console.error('Error rejecting request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getSellerName = (sellerId) => {
    return sellerDetails[sellerId]?.name || 'Loading...';
  };

  const getSellerInitial = (sellerId) => {
    const name = sellerDetails[sellerId]?.name;
    return name ? name.charAt(0).toUpperCase() : 'S';
  };

  return (
    <div className="flex-1 p-8">
      <div className={`max-w-6xl ${showModal ? 'blur-sm' : ''}`}>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Requests</h1>
        
        <div className='rounded-2xl border-2'>
          {/* Pending Requests Section */}
          <div className="rounded-2xl p-8 border-b-2">
            <h2 className="text-2xl font-semibold text-primary mb-6">Pending Requests</h2>
            
            <div className="bg-accent rounded-xl p-6 min-h-[250px]">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <p className="text-gray-500 text-center">Loading pending requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <p className="text-gray-500 text-center">
                    No pending requests.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      onClick={() => openRequestModal(request)}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {getSellerInitial(request.sellerId)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {getSellerName(request.sellerId)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {request.prodId.prodName} - {request.quantity} units
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                            Pending
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Request History Section */}
          <div className="rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-primary mb-6">Requests History</h2>
            
            <div className="bg-accent rounded-xl p-6 min-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500 text-center">Loading request history...</p>
                </div>
              ) : requestHistory.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500 text-center">
                    No requests received yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requestHistory.map((request) => (
                    <div
                      key={request._id}
                      onClick={() => openRequestModal(request)}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            request.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {getSellerInitial(request.sellerId)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {getSellerName(request.sellerId)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {request.prodId.prodName} - {request.quantity} units
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            request.status === 'accepted' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {request.status === 'accepted' ? 'Accepted' : 'Rejected'}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Request Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {success}
                </div>
              )}

              {/* Request ID */}
              <div className="bg-accent rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Request ID</p>
                <p className="font-semibold text-gray-800">{selectedRequest.requestId}</p>
              </div>

              {/* Seller Information */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Seller Name</p>
                  <p className="font-semibold text-gray-800">
                    {getSellerName(selectedRequest.sellerId)}
                  </p>
                </div>
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Shop Name</p>
                  <p className="font-semibold text-gray-800">{selectedRequest.shopId?.name}</p>
                </div>
              </div>

              {/* Product Information */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Product Name</p>
                  <p className="font-semibold text-gray-800">{selectedRequest.prodId.prodName}</p>
                </div>
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Product ID</p>
                  <p className="font-semibold text-gray-800">{selectedRequest.prodId.prodId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-semibold text-gray-800">{selectedRequest.prodId.category}</p>
                </div>
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Quantity</p>
                  <p className="font-semibold text-gray-800">{selectedRequest.quantity} units</p>
                </div>
              </div>

              {/* Message */}
              {selectedRequest.message && (
                <div className="bg-accent rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Message from Seller</p>
                  <p className="text-gray-800">{selectedRequest.message}</p>
                </div>
              )}

              {/* Status and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedRequest.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-700'
                      : selectedRequest.status === 'accepted'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                </div>
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Request Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(selectedRequest.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              {selectedRequest.status === 'pending' ? (
                <>
                  <button
                    onClick={handleRejectRequest}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleAcceptRequest}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Processing...' : 'Accept'}
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-primary hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}