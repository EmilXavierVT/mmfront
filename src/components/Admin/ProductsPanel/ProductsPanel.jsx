import { useState } from 'react';
import { productApi } from '../../../api/products.js';
import { Icon } from '../../Shared/Icon.jsx';

function formatUpdatedDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium' }).format(date);
}

export function ProductsPanel({
  products,
  filteredProducts,
  productsLoading,
  productsError,
  productSearch,
  productYear,
  productYears,
  productMinPrice,
  productMaxPrice,
  productSort,
  productTypeOptions,
  onProductsChanged,
  onSearchChange,
  onYearChange,
  onMinPriceChange,
  onMaxPriceChange,
  onSortChange,
  onClearFilters,
}) {
  const typeLabels = Object.fromEntries(productTypeOptions);
  const [editingProductNumber, setEditingProductNumber] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '' });
  const [savingProductNumber, setSavingProductNumber] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const startEditing = (product) => {
    setEditingProductNumber(product.economicProductNumber || product.id);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
    });
    setEditError('');
    setEditSuccess('');
  };

  const cancelEditing = () => {
    setEditingProductNumber(null);
    setEditError('');
  };

  const saveProduct = async (product) => {
    const productNumber = product.economicProductNumber || product.id;
    const price = Number(editForm.price);
    if (!editForm.name.trim()) {
      setEditError('Product name is required.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setEditError('Price must be zero or greater.');
      return;
    }

    setSavingProductNumber(productNumber);
    setEditError('');
    setEditSuccess('');
    try {
      await productApi.update(productNumber, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price,
      });
      setEditingProductNumber(null);
      setEditSuccess(`${editForm.name.trim()} was updated in e-conomic.`);
      await onProductsChanged();
    } catch (error) {
      setEditError(error.message || 'Could not update the e-conomic product.');
    } finally {
      setSavingProductNumber(null);
    }
  };

  return (
    <section className="profile-requests admin-products">
      <section className="profile-grid admin-grid">
        <div className="profile-panel">
          <span>Products</span>
          <h2>{products.length}</h2>
          <p>Available products returned by e-conomic.</p>
        </div>
        <div className="profile-panel accent">
          <span>Source</span>
          <h2>Live</h2>
          <p>Product details are not stored in PostgreSQL.</p>
        </div>
      </section>

      <div className="admin-products-list">
        <div className="profile-section-head admin-products-list-head">
          <div>
            <div className="section-eyebrow">e-conomic</div>
            <h2>Product inventory</h2>
          </div>
          <button className="btn btn-blue" type="button" onClick={onProductsChanged} disabled={productsLoading}>
            Refresh <Icon name="arrow" size={18} />
          </button>
        </div>

        {productsLoading && <div className="profile-empty">Loading products from e-conomic...</div>}
        {productsError && <div className="form-error">{productsError}</div>}
        {!productsLoading && !productsError && products.length === 0 && (
          <div className="profile-empty">No products found in e-conomic.</div>
        )}

        {editError && <div className="form-error">{editError}</div>}
        {editSuccess && <div className="form-success">{editSuccess}</div>}

        {products.length > 0 && (
          <div className="admin-product-filters">
            <div className="field admin-product-search">
              <label>Search products</label>
              <input
                value={productSearch}
                onChange={event => onSearchChange(event.target.value)}
                placeholder="Number, name, group, category"
              />
            </div>
            <div className="field">
              <label>Product year</label>
              <select value={productYear} onChange={event => onYearChange(event.target.value)}>
                <option value="all">All years</option>
                {productYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Minimum price</label>
              <input
                type="number"
                min="0"
                step="1"
                value={productMinPrice}
                onChange={event => onMinPriceChange(event.target.value)}
                placeholder="0"
              />
            </div>
            <div className="field">
              <label>Maximum price</label>
              <input
                type="number"
                min="0"
                step="1"
                value={productMaxPrice}
                onChange={event => onMaxPriceChange(event.target.value)}
                placeholder="No maximum"
              />
            </div>
            <div className="field">
              <label>Sort</label>
              <select value={productSort} onChange={event => onSortChange(event.target.value)}>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="category-asc">Category A-Z</option>
                <option value="price-asc">Price low-high</option>
                <option value="price-desc">Price high-low</option>
                <option value="updated-desc">Recently updated</option>
              </select>
            </div>
            <button
              className="btn btn-cream admin-clear-product-filters"
              type="button"
              onClick={onClearFilters}
              aria-label="Clear product filters"
              title="Clear product filters"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        )}

        {products.length > 0 && (
          <div className="admin-product-results">{filteredProducts.length} of {products.length} products</div>
        )}

        {!productsLoading && !productsError && products.length > 0 && filteredProducts.length === 0 && (
          <div className="profile-empty">No products match your search.</div>
        )}

        {filteredProducts.length > 0 && (
          <div className="admin-product-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>Product no.</th>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Website category</th>
                  <th>Price</th>
                  <th>Updated</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const productNumber = product.economicProductNumber || product.id;
                  const editing = editingProductNumber === productNumber;
                  const saving = savingProductNumber === productNumber;
                  return (
                    <tr key={productNumber}>
                      <td className="admin-product-id">{productNumber}</td>
                      <td>
                        {editing ? (
                          <input
                            aria-label={`Name for product ${productNumber}`}
                            value={editForm.name}
                            maxLength="300"
                            onChange={event => setEditForm(current => ({ ...current, name: event.target.value }))}
                          />
                        ) : <strong>{product.name}</strong>}
                      </td>
                      <td>{product.economicProductGroupName || product.economicProductGroupNumber || 'None'}</td>
                      <td>{typeLabels[String(product.type)] || `Type ${product.type}`}</td>
                      <td>
                        {editing ? (
                          <input
                            aria-label={`Price for product ${productNumber}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.price}
                            onChange={event => setEditForm(current => ({ ...current, price: event.target.value }))}
                          />
                        ) : `${Number(product.price || 0).toLocaleString('da-DK')} kr`}
                      </td>
                      <td>{formatUpdatedDate(product.economicLastUpdated)}</td>
                      <td>
                        {editing ? (
                          <textarea
                            aria-label={`Description for product ${productNumber}`}
                            value={editForm.description}
                            maxLength="500"
                            rows="2"
                            onChange={event => setEditForm(current => ({ ...current, description: event.target.value }))}
                          />
                        ) : product.description || 'None'}
                      </td>
                      <td>
                        <div className="admin-product-actions">
                          {editing ? (
                            <>
                              <button className="btn btn-blue" type="button" disabled={saving} onClick={() => saveProduct(product)}>
                                {saving ? 'Saving...' : 'Save'} <Icon name="check" size={16} />
                              </button>
                              <button className="btn btn-cream" type="button" disabled={saving} onClick={cancelEditing}>
                                Cancel <Icon name="x" size={16} />
                              </button>
                            </>
                          ) : (
                            <button className="btn btn-cream" type="button" onClick={() => startEditing(product)}>
                              Edit <Icon name="edit" size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
