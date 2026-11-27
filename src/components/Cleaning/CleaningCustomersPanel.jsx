import { useEffect, useMemo, useState } from 'react';
import { cleaningListApi } from '../../api/cleaningLists.js';
import { Icon } from '../Shared/Icon.jsx';
import { CleaningVisitChecklistPanel } from './CleaningVisitChecklistPanel.jsx';
import './CleaningCustomersPanel.css';

function makeDraft(list) {
  return {
    ...list,
    title: list.title || 'Cleaning list',
    notes: list.notes || '',
    sections: (list.sections || []).map((section, index) => ({
      key: `room-${index}`,
      title: section.title,
      text: section.tasks.join('\n'),
    })),
  };
}

function CleaningListDetail({ customer, templates, canEdit, staffUser, initialVisitId, onSaved, onDirtyChange, onSavingChange }) {
  const [state, setState] = useState({ loading: true, list: null, error: '' });
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await cleaningListApi.get(customer.key);
        if (!cancelled) {
          setState({ loading: false, list, error: '' });
          setDraft(makeDraft(list));
        }
      } catch (error) {
        if (!cancelled) setState({ loading: false, list: null, error: error.message || 'Could not load this cleaning list.' });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [customer.key, refresh]);

  function changeDraft(update) {
    setDraft(current => ({ ...current, ...update }));
    onDirtyChange(true);
    setSuccess('');
  }

  function changeRoom(index, update) {
    changeDraft({ sections: draft.sections.map((section, nextIndex) => nextIndex === index ? { ...section, ...update } : section) });
  }

  function cancelEditing() {
    setDraft(makeDraft(state.list));
    setEditing(false);
    setSaveError('');
    onDirtyChange(false);
  }

  function useTemplate() {
    const template = templates.find(item => item.key === templateKey);
    if (!template) return;
    if (draft.sections.length && !window.confirm(`Replace the draft for ${customer.name} with ${template.customerName}'s document list? Your saved list changes only when you save.`)) return;
    changeDraft({ ...makeDraft(template), id: state.list.id, version: state.list.version });
    setEditing(true);
    setSaveError('');
  }

  async function save(event) {
    event.preventDefault();
    const sections = draft.sections.map(section => ({
      title: section.title.trim(),
      tasks: section.text.split('\n').map(task => task.trim()).filter(Boolean),
    }));
    if (!draft.title.trim() || !sections.length || sections.some(section => !section.title || !section.tasks.length)) {
      setSaveError('Add a list title and at least one room. Every room needs a name and at least one task.');
      return;
    }
    setSaving(true);
    onSavingChange(true);
    setSaveError('');
    setSuccess('');
    try {
      const list = await cleaningListApi.save(customer.key, {
        id: state.list.id,
        version: state.list.version,
        title: draft.title.trim(),
        notes: draft.notes.trim(),
        sections,
      });
      setState({ loading: false, list, error: '' });
      setDraft(makeDraft(list));
      setEditing(false);
      onDirtyChange(false);
      onSaved(customer.key);
      setSuccess(`Cleaning list saved for ${customer.name}.`);
    } catch (error) {
      setSaveError(error.message || 'Could not save the cleaning list. Your edits are still here.');
    } finally {
      setSaving(false);
      onSavingChange(false);
    }
  }

  if (state.loading) return <div className="profile-empty" role="status">Loading cleaning list...</div>;
  if (state.error) return (
    <div className="profile-panel">
      <div className="form-error" role="alert">{state.error}</div>
      <button className="btn btn-cream" type="button" onClick={() => setRefresh(value => value + 1)}>Try again</button>
    </div>
  );
  const list = state.list;
  const taskCount = list.sections.reduce((sum, section) => sum + section.tasks.length, 0);

  return (
    <article className="profile-panel cleaning-list-detail">
      <div className="cleaning-list-heading">
        <div>
          <div className="section-eyebrow">{customer.customerNumber ? `Customer #${customer.customerNumber}` : 'Cleaning customer'}</div>
          <h2>{customer.name}</h2>
          <p>{list.id ? `${list.sections.length} rooms · ${taskCount} tasks` : 'No cleaning list yet'}</p>
        </div>
        {canEdit && !editing && (
          <button className="btn btn-blue" type="button" onClick={() => { setEditing(true); setSuccess(''); }}>
            <Icon name={list.id ? 'edit' : 'plus'} size={18} /> {list.id ? 'Edit list' : 'Create list'}
          </button>
        )}
      </div>

      {success && <div className="form-success" role="status">{success}</div>}
      {saveError && <div className="form-error" role="alert">{saveError}</div>}

      {canEdit && (editing || !list.id) && templates.length > 0 && (
        <div className="cleaning-list-import">
          <div className="field">
            <label htmlFor="cleaning-document-list">Lists from the cleaning document</label>
            <select id="cleaning-document-list" value={templateKey} disabled={saving} onChange={event => setTemplateKey(event.target.value)}>
              <option value="">Choose a customer's list</option>
              {templates.map(template => <option key={template.key} value={template.key}>{template.customerName} · {template.sections.length} rooms</option>)}
            </select>
          </div>
          <button className="btn btn-cream" type="button" disabled={!templateKey || saving} onClick={useTemplate}>Use list</button>
          <p>The selected list will be linked to {customer.name} when you save.</p>
        </div>
      )}

      {editing ? (
        <form className="cleaning-list-editor" onSubmit={save}>
          <p>Changes apply to the customer’s list for future visits. Started visit checklists keep their original tasks and progress.</p>
          <fieldset disabled={saving}>
            <div className="field">
              <label htmlFor="cleaning-list-title">List title</label>
              <input id="cleaning-list-title" value={draft.title} maxLength={200} required onChange={event => changeDraft({ title: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="cleaning-list-notes">Care notes</label>
              <textarea id="cleaning-list-notes" value={draft.notes} maxLength={10000} rows={3} placeholder="Allergies, delicate surfaces, or other special instructions" onChange={event => changeDraft({ notes: event.target.value })} />
            </div>
            {draft.sections.map((section, index) => (
              <section className="cleaning-list-room cleaning-list-room-editor" key={section.key}>
                <div className="cleaning-list-heading">
                  <div className="field">
                    <label htmlFor={`cleaning-room-${index}`}>Room {index + 1}</label>
                    <input id={`cleaning-room-${index}`} value={section.title} maxLength={200} required onChange={event => changeRoom(index, { title: event.target.value })} />
                  </div>
                  <button className="btn btn-cream" type="button" aria-label={`Remove ${section.title || `room ${index + 1}`}`} onClick={() => changeDraft({ sections: draft.sections.filter((_, nextIndex) => nextIndex !== index) })}>
                    <Icon name="x" size={18} /> Remove room
                  </button>
                </div>
                <div className="field">
                  <label htmlFor={`cleaning-tasks-${index}`}>Tasks · one per line</label>
                  <textarea id={`cleaning-tasks-${index}`} value={section.text} required rows={Math.min(12, Math.max(4, section.text.split('\n').length + 1))} onChange={event => changeRoom(index, { text: event.target.value })} />
                </div>
              </section>
            ))}
            <button className="btn btn-cream" type="button" disabled={draft.sections.length >= 100} onClick={() => changeDraft({ sections: [...draft.sections, { key: crypto.randomUUID(), title: '', text: '' }] })}>
              <Icon name="plus" size={18} /> Add room
            </button>
            <div className="cleaning-list-actions">
              <button className="btn btn-blue" type="submit">{saving ? 'Saving...' : `Save list for ${customer.name}`}</button>
              <button className="btn btn-cream" type="button" onClick={cancelEditing}>Cancel</button>
            </div>
          </fieldset>
        </form>
      ) : list.id ? (
        <CleaningVisitChecklistPanel customer={customer} template={list} staffUser={staffUser} initialVisitId={initialVisitId} />
      ) : <div className="profile-empty">{canEdit ? 'Create a list or choose one from the document above.' : 'A cleaning list has not been added for this customer yet.'}</div>}
    </article>
  );
}

export function CleaningCustomersPanel({ canEdit = false, personal = false, staffUser, initialSelection }) {
  const [state, setState] = useState({ loading: true, customers: [], templates: [], error: '' });
  const [selectedKey, setSelectedKey] = useState(initialSelection?.customerKey || '');
  const [search, setSearch] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [templateError, setTemplateError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [customers, templates] = await Promise.all([
          cleaningListApi.getCustomers(),
          canEdit ? cleaningListApi.getTemplates().catch(error => {
            if (!cancelled) setTemplateError(error.message || 'Document lists are unavailable.');
            return [];
          }) : Promise.resolve([]),
        ]);
        if (!cancelled) setState({ loading: false, customers, templates, error: '' });
      } catch (error) {
        if (!cancelled) setState({ loading: false, customers: [], templates: [], error: error.message || 'Could not load cleaning customers.' });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [canEdit, refresh]);

  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return state.customers.filter(customer => `${customer.name} ${customer.customerNumber || ''}`.toLocaleLowerCase().includes(query));
  }, [search, state.customers]);
  const selected = state.customers.find(customer => customer.key === selectedKey) || state.customers[0];

  function selectCustomer(key) {
    if (key === selected?.key || saving) return;
    if (dirty && !window.confirm('Discard your unsaved cleaning list changes?')) return;
    setDirty(false);
    setSelectedKey(key);
  }

  function handleSaved(key) {
    setState(current => ({ ...current, customers: current.customers.map(customer => customer.key === key ? { ...customer, hasList: true } : customer) }));
  }

  return (
    <section className="profile-requests cleaning-customers-panel">
      <div className="profile-section-head">
        <div>
          <div className="section-eyebrow">Cleaning</div>
          <h2>{personal ? 'Your cleaning list' : 'Cleaning customers'}</h2>
          <p>{canEdit ? 'Manage the rooms, tasks, and care notes for each customer.' : 'Room-by-room cleaning instructions and care notes.'}</p>
        </div>
        {!personal && !state.loading && <span className="cleaning-list-count">{state.customers.filter(customer => customer.hasList).length} of {state.customers.length} with a list</span>}
      </div>
      {state.loading && <div className="profile-empty" role="status">Loading cleaning customers...</div>}
      {state.error && <div className="form-error" role="alert">{state.error} <button className="btn btn-cream" type="button" onClick={() => setRefresh(value => value + 1)}>Try again</button></div>}
      {templateError && <div className="form-error" role="alert">Document lists could not be loaded: {templateError}</div>}
      {!state.loading && !state.error && !state.customers.length && <div className="profile-empty">{personal ? 'Your cleaning list will appear here when it is ready.' : 'No cleaning customers available.'}</div>}
      {selected && (
        <div className={`cleaning-customers-layout ${personal && state.customers.length === 1 ? 'cleaning-customers-personal' : ''}`}>
          {(!personal || state.customers.length > 1) && (
            <aside className="cleaning-customer-sidebar" aria-label="Cleaning customers">
              <div className="field">
                <label htmlFor="cleaning-customer-search">Search customers</label>
                <input id="cleaning-customer-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or customer number" />
              </div>
              <div className="cleaning-customer-queue">
                {filtered.map(customer => (
                  <button className={`admin-request-row ${selected.key === customer.key ? 'selected' : ''}`} key={customer.key} type="button" disabled={saving} aria-pressed={selected.key === customer.key} onClick={() => selectCustomer(customer.key)}>
                    <span>{customer.customerNumber ? `Customer #${customer.customerNumber}` : 'Customer account'}</span>
                    <strong>{customer.name}</strong>
                    <small>{customer.hasList ? 'Cleaning list ready' : 'No list yet'}</small>
                  </button>
                ))}
                {!filtered.length && <div className="profile-empty">No customers match your search.</div>}
              </div>
            </aside>
          )}
          <CleaningListDetail key={selected.key} customer={selected} templates={state.templates} canEdit={canEdit} staffUser={staffUser} initialVisitId={initialSelection?.customerKey === selected.key ? initialSelection.visitId : undefined} onSaved={handleSaved} onDirtyChange={setDirty} onSavingChange={setSaving} />
        </div>
      )}
    </section>
  );
}
