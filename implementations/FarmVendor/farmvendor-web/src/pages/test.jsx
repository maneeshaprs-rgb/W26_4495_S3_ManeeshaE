import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import "./dashboard.css";

const VendorDashboard = () => {
  const [lowStock, setLowStock] = useState([]);
  const [incomingDispatches, setIncomingDispatches] = useState([]);
  const [openDemandRequests, setOpenDemandRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [demandForm, setDemandForm] = useState({ productId: "", unit: "", quantity: "", neededBy: "" });

  useEffect(() => {
    fetchLowStock();
    fetchIncomingDispatches();
    fetchOpenDemandRequests();
    fetchProducts();
  }, []);

  const fetchLowStock = async () => {
    const res = await axios.get("/api/vendor/lowstock");
    setLowStock(res.data);
  };

  const fetchIncomingDispatches = async () => {
    const res = await axios.get("/api/vendor/dispatches/incoming");
    setIncomingDispatches(res.data);
  };

  const fetchOpenDemandRequests = async () => {
    const res = await axios.get("/api/vendor/demandrequests?status=Open");
    setOpenDemandRequests(res.data);
  };

  const fetchProducts = async () => {
    const res = await axios.get("/api/products/active");
    setProducts(res.data);
  };

  const handleDemandSubmit = async () => {
    if (!demandForm.productId || !demandForm.quantity || !demandForm.neededBy) return alert("Please fill all fields");

    await axios.post("/api/vendor/demandrequests", {
      productId: demandForm.productId,
      quantityRequested: Number(demandForm.quantity),
      unit: demandForm.unit,
      neededBy: demandForm.neededBy,
    });

    fetchOpenDemandRequests();
    setDemandForm({ productId: "", unit: "", quantity: "", neededBy: "" });
  };

  const renderProductOptionLabel = (p) => (
    <div className="select-option">
      {p.imageThumbUrl && <img src={p.imageThumbUrl} alt={p.name} className="dispatch-select-thumb" />}
      <span>{p.name} ({p.defaultUnit})</span>
    </div>
  );

  return (
    <div className="dashboard-container">
      <h2>Welcome, Vendor 1</h2>

      <div className="top-cards">
        <div className="card">Incoming Deliveries: {incomingDispatches.length}</div>
        <div className="card">Low Stock Alerts: {lowStock.length}</div>
        <div className="card">Expiring Items: 1</div>
      </div>

      {/* Low Stock Table */}
      <div className="table-container">
        <h3>Low Stock</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((r) => (
              <tr key={r.productId}>
                <td className="table-product">
                  {r.imageThumbUrl && <img src={r.imageThumbUrl} alt={r.name} className="table-thumb" />}
                  {r.name}
                </td>
                <td>{r.level}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Incoming Dispatches */}
      <div className="table-container">
        <h3>Incoming Dispatches</h3>
        <table>
          <thead>
            <tr>
              <th>Dispatch</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Dispatch Date</th>
            </tr>
          </thead>
          <tbody>
            {incomingDispatches.map((r) => (
              <tr key={r.dispatchId}>
                <td>#{r.dispatchId}</td>
                <td className="table-product">
                  {r.imageThumbUrl && <img src={r.imageThumbUrl} alt={r.product} className="table-thumb" />}
                  {r.product}
                </td>
                <td>{r.quantityDispatched} {r.unit}</td>
                <td>{r.deliveryStatus}</td>
                <td>{new Date(r.dispatchDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* My Open Demand Requests */}
      <div className="table-container">
        <h3>My Open Demand Requests</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Needed By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {openDemandRequests.map((r) => (
              <tr key={r.demandRequestId}>
                <td className="table-product">
                  {r.imageThumbUrl && <img src={r.imageThumbUrl} alt={r.product} className="table-thumb" />}
                  {r.product}
                </td>
                <td>{r.qty}</td>
                <td>{r.unit}</td>
                <td>{new Date(r.neededBy).toLocaleDateString()}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Demand Request Form */}
      <div className="form-container">
        <h3>Create Demand Request</h3>
        <Select
          value={products.find((p) => p.productId === demandForm.productId) || null}
          options={products}
          getOptionLabel={(p) => p.name}
          getOptionValue={(p) => p.productId}
          formatOptionLabel={renderProductOptionLabel}
          onChange={(p) => setDemandForm((prev) => ({ ...prev, productId: p.productId, unit: p.defaultUnit }))}
          placeholder="-- Select --"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={demandForm.quantity}
          onChange={(e) => setDemandForm((prev) => ({ ...prev, quantity: e.target.value }))}
        />
        <input
          type="date"
          value={demandForm.neededBy}
          onChange={(e) => setDemandForm((prev) => ({ ...prev, neededBy: e.target.value }))}
        />
        <button className="btn-save" onClick={handleDemandSubmit}>Submit Request</button>
      </div>
    </div>
  );
};

export default VendorDashboard;