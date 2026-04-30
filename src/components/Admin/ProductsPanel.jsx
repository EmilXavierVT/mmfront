import { Icon } from '../Icon.jsx';

export function ProductsPanel({
  products,
  filteredProducts,
  productsLoading,
  productsError,
  productForm,
  productSaving,
  productError,
  productSuccess,
  productListError,
  productListSuccess,
  productSearch,
  productTypeOptions,
  savingProductId,
  deletingProductId,
  onCreateProduct,
  onUpdateProductField,
  onProductsChanged,
  onSearchChange,
  getProductEdit,
  onUpdateProductEdit,
  onSaveProduct,
  onDeleteProduct,
}) {
  return (
        <section className="profile-requests admin-products">
          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Products</div>
              <h2>Add product</h2>
            </div>
          </div>

          <form className="admin-product-form" onSubmit={onCreateProduct}>
            {productError && <div className="form-error">{productError}</div>}
            {productSuccess && <div className="form-success">{productSuccess}</div>}

            <div className="field-row">
              <div className="field">
                <label>Name</label>
                <input
                  value={productForm.name}
                  onChange={event => onUpdateProductField('name', event.target.value)}
                  placeholder="Seasonal lunch box"
                />
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={productForm.type}
                  onChange={event => onUpdateProductField('type', event.target.value)}
                >
                  {productTypeOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Description</label>
              <textarea
                value={productForm.description}
                onChange={event => onUpdateProductField('description', event.target.value)}
                placeholder="Short customer-facing description"
                rows="4"
              />
            </div>

            <div className="field-row compact">
              <div className="field">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.price}
                  onChange={event => onUpdateProductField('price', event.target.value)}
                  placeholder="125"
                />
              </div>
              <div className="admin-product-submit">
                <button className="btn btn-blue" type="submit" disabled={productSaving}>
                  {productSaving ? 'Adding...' : 'Add product'}
                  <Icon name="plus" size={18} />
                </button>
              </div>
            </div>
          </form>

          <div className="admin-products-list">
            <div className="profile-section-head admin-products-list-head">
              <div>
                <div className="section-eyebrow">Inventory</div>
                <h2>All products</h2>
              </div>
              <button className="btn btn-blue" type="button" onClick={onProductsChanged} disabled={productsLoading}>
                Refresh <Icon name="arrow" size={18} />
              </button>
            </div>

            {productListError && <div className="form-error">{productListError}</div>}
            {productListSuccess && <div className="form-success">{productListSuccess}</div>}
            {productsLoading && <div className="profile-empty">Loading products...</div>}
            {productsError && <div className="form-error">{productsError}</div>}
            {!productsLoading && !productsError && products.length === 0 && (
              <div className="profile-empty">No products found.</div>
            )}

            {products.length > 0 && (
              <div className="admin-product-search field">
                <label>Search products</label>
                <input
                  value={productSearch}
                  onChange={event => onSearchChange(event.target.value)}
                  placeholder="Search by name, type, price, id, or description"
                />
              </div>
            )}

            {!productsLoading && !productsError && products.length > 0 && filteredProducts.length === 0 && (
              <div className="profile-empty">No products match your search.</div>
            )}

            {products.length > 0 && (
              <div className="admin-product-table-wrap">
                <table className="admin-product-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => {
                      const edit = getProductEdit(product);
                      const saving = savingProductId === product.id;
                      const deleting = deletingProductId === product.id;

                      return (
                        <tr key={product.id}>
                          <td className="admin-product-id">#{product.id}</td>
                          <td>
                            <input
                              aria-label={`Name for product ${product.id}`}
                              value={edit.name}
                              onChange={event => onUpdateProductEdit(product, 'name', event.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              aria-label={`Type for product ${product.id}`}
                              value={edit.type}
                              onChange={event => onUpdateProductEdit(product, 'type', event.target.value)}
                            >
                              {productTypeOptions.map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              aria-label={`Price for product ${product.id}`}
                              type="number"
                              min="0"
                              step="1"
                              value={edit.price}
                              onChange={event => onUpdateProductEdit(product, 'price', event.target.value)}
                            />
                          </td>
                          <td>
                            <textarea
                              aria-label={`Description for product ${product.id}`}
                              value={edit.description}
                              onChange={event => onUpdateProductEdit(product, 'description', event.target.value)}
                              rows="2"
                            />
                          </td>
                          <td>
                            <div className="admin-product-actions">
                              <button className="btn btn-blue" type="button" onClick={() => onSaveProduct(product)} disabled={saving || deleting}>
                                {saving ? 'Saving...' : 'Save'}
                                <Icon name="check" size={18} />
                              </button>
                              <button className="btn btn-cream admin-delete-product-btn" type="button" onClick={() => onDeleteProduct(product)} disabled={saving || deleting}>
                                {deleting ? 'Deleting...' : 'Delete'}
                                <Icon name="x" size={18} />
                              </button>
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
        </section>  );
}
