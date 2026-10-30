'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { CalendarDays, ChevronDown, PenLine, Upload } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import type { FormField } from '@/types';
import { getFieldTypeMeta, FIELD_TYPE_META } from './fieldTypeMeta';

interface FieldEditorSheetProps {
  field: FormField;
  open: boolean;
  index: number;
  total: number;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (field: FormField) => void;
}

function ChoiceMarker({ type }: { type: FormField['type'] }) {
  if (type === 'RADIO') return <span className="field-preview-marker is-radio" />;
  if (type === 'CHECKBOX') return <span className="field-preview-marker is-checkbox" />;
  return null;
}

function FieldPreview({ field }: { field: FormField }) {
  const meta = getFieldTypeMeta(field.type);
  const choices = (field.choices ?? []).map((choice) => choice.trim()).filter(Boolean);
  const visibleChoices = choices.length ? choices.slice(0, 4) : ['Option 1', 'Option 2'];
  const hiddenChoiceCount = Math.max(0, choices.length - visibleChoices.length);
  const label = field.displayName.trim() || 'Untitled question';

  const answer = (() => {
    if (meta.hasChoices) {
      if (field.type === 'DROPDOWN') {
        return (
          <div className="field-preview-input is-muted">
            <span>{field.placeholder?.trim() || 'Choose an option'}</span>
            <ChevronDown size={15} />
          </div>
        );
      }
      if (field.type === 'MULTIPLE_CHOICE') {
        return (
          <div className="field-preview-pills">
            {visibleChoices.map((choice, choiceIndex) => (
              <span key={`${choice}-${choiceIndex}`}>{choice}</span>
            ))}
            {hiddenChoiceCount > 0 && <span className="is-more">+{hiddenChoiceCount} more</span>}
          </div>
        );
      }
      return (
        <>
          <div className="field-preview-options">
            {visibleChoices.map((choice, choiceIndex) => (
              <div key={`${choice}-${choiceIndex}`} className="field-preview-option">
                <ChoiceMarker type={field.type} />
                <span>{choice}</span>
              </div>
            ))}
          </div>
          {hiddenChoiceCount > 0 && <p className="field-preview-more">+{hiddenChoiceCount} more options</p>}
        </>
      );
    }

    if (field.type === 'RATING') {
      return <div className="field-preview-rating">{[1, 2, 3, 4, 5].map((rating) => <span key={rating}>{rating}</span>)}</div>;
    }

    if (field.type === 'DATE') {
      return <div className="field-preview-input is-muted"><span>MM / DD / YYYY</span><CalendarDays size={15} /></div>;
    }

    if (field.type === 'FILE_UPLOAD') {
      return <div className="field-preview-upload"><Upload size={16} /><span>Drop a file or browse</span></div>;
    }

    if (field.type === 'SIGNATURE') {
      return <div className="field-preview-signature"><PenLine size={15} /><span>Sign here</span><i /></div>;
    }

    if (field.type === 'GRID') {
      return (
        <div className="field-preview-grid">
          {Array.from({ length: 9 }, (_, cell) => <span key={cell} />)}
        </div>
      );
    }

    if (field.type === 'MULTI_LINE' || field.type === 'ADDRESS') {
      return (
        <div className="field-preview-input is-area">
          <span>{field.placeholder?.trim() || 'Type your answer…'}</span>
          <i /><i />
        </div>
      );
    }

    return (
      <div className="field-preview-input">
        <span>{field.placeholder?.trim() || 'Type your answer…'}</span>
      </div>
    );
  })();

  return (
    <div className="field-preview-card" aria-hidden="true">
      <p className="field-preview-label">
        {label}
        {field.mand && <span aria-hidden="true"> *</span>}
      </p>
      {answer}
    </div>
  );
}

export function FieldEditorSheet({ field, open, index, total, returnFocusRef, onOpenChange, onSave }: FieldEditorSheetProps) {
  const [draft, setDraft] = useState<FormField>(field);
  const [labelError, setLabelError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [invalidChoice, setInvalidChoice] = useState<number | null>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingFocusRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft({ ...field, choices: field.choices ? [...field.choices] : undefined });
    setLabelError('');
    setOptionsError('');
    setInvalidChoice(null);
    pendingFocusRef.current = null;
  }, [open, field]);

  const meta = getFieldTypeMeta(draft.type);
  const TypeIcon = meta.icon;
  const choices = draft.choices ?? [];

  useEffect(() => {
    const nextIndex = pendingFocusRef.current;
    if (nextIndex === null) return;
    pendingFocusRef.current = null;
    optionRefs.current[nextIndex]?.focus();
  }, [choices.length]);

  const patchDraft = (patch: Partial<FormField>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const chooseType = (type: FormField['type']) => {
    const nextMeta = getFieldTypeMeta(type);
    setDraft((current) => ({
      ...current,
      type,
      choices: nextMeta.hasChoices
        ? current.choices?.length ? current.choices : ['Option 1', 'Option 2']
        : current.choices,
      placeholder: nextMeta.hasPlaceholder && !current.placeholder && type === 'DROPDOWN' ? 'Choose an option' : current.placeholder,
    }));
    setOptionsError('');
    setInvalidChoice(null);
  };

  const updateChoice = (choiceIndex: number, value: string) => {
    patchDraft({ choices: choices.map((choice, index) => index === choiceIndex ? value : choice) });
    setOptionsError('');
    setInvalidChoice(null);
  };

  const addChoice = () => {
    pendingFocusRef.current = choices.length;
    patchDraft({ choices: [...choices, ''] });
    setOptionsError('');
    setInvalidChoice(null);
  };

  const removeChoice = (choiceIndex: number) => {
    if (choices.length <= 1) return;
    pendingFocusRef.current = Math.max(0, choiceIndex - 1);
    patchDraft({ choices: choices.filter((_, index) => index !== choiceIndex) });
    setOptionsError('');
    setInvalidChoice(null);
  };

  const handleSave = () => {
    const displayName = draft.displayName.trim();
    if (!displayName) {
      setLabelError('Give this question a label.');
      labelRef.current?.focus();
      return;
    }

    let nextChoices: string[] | undefined;
    if (meta.hasChoices) {
      const trimmedChoices = choices.map((choice) => choice.trim());
      nextChoices = trimmedChoices.filter(Boolean);
      if (!nextChoices.length) {
        setOptionsError('Add at least one option.');
        setInvalidChoice(0);
        optionRefs.current[0]?.focus();
        return;
      }
      const seen = new Set<string>();
      let duplicateIndex = -1;
      trimmedChoices.forEach((choice, choiceIndex) => {
        if (!choice) return;
        if (seen.has(choice) && duplicateIndex === -1) duplicateIndex = choiceIndex;
        seen.add(choice);
      });
      if (duplicateIndex !== -1) {
        setOptionsError('Options need to be unique.');
        setInvalidChoice(duplicateIndex);
        optionRefs.current[duplicateIndex]?.focus();
        return;
      }
    }

    onSave({
      ...draft,
      displayName,
      choices: meta.hasChoices ? nextChoices : undefined,
      placeholder: meta.hasPlaceholder ? draft.placeholder?.trim() || undefined : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="field-editor-sheet"
        overlayClassName="field-editor-overlay"
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          if (!returnFocusRef?.current) return;
          event.preventDefault();
          returnFocusRef.current.focus();
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          labelRef.current?.focus();
          labelRef.current?.select();
        }}
      >
        <header className="field-editor-head">
          <div>
            <p className="field-editor-eyebrow">Question {Math.min(index + 1, total)} of {total}</p>
            <DialogTitle className="field-editor-title">Edit question</DialogTitle>
            <DialogDescription className="field-editor-description">
              Shape the question, answer type, and rules.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button type="button" className="field-editor-close" aria-label="Close field editor">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
                <path d="M4 4l9 9M13 4l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </DialogClose>
        </header>

        <form
          className="field-editor-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              handleSave();
            }
          }}
        >
          <div className="field-editor-body">
            <section className="field-editor-preview" aria-label="Live preview">
              <div className="field-editor-section-heading">
                <span>Live preview</span>
                <span className="field-editor-preview-badge">Respondent view</span>
              </div>
              <FieldPreview field={draft} />
            </section>

            <section className="field-editor-section" aria-labelledby="field-editor-question-heading">
              <div className="field-editor-section-heading">
                <h3 id="field-editor-question-heading">Question</h3>
              </div>
              <div className="field-editor-control">
                <Label htmlFor={`field-label-${field.fieldId}`}>Question label</Label>
                <Input
                  ref={labelRef}
                  id={`field-label-${field.fieldId}`}
                  value={draft.displayName}
                  onChange={(event) => {
                    patchDraft({ displayName: event.target.value });
                    setLabelError('');
                  }}
                  placeholder="Ask a clear, specific question"
                  aria-invalid={Boolean(labelError)}
                  aria-describedby={labelError ? `field-label-error-${field.fieldId}` : undefined}
                  className="field-editor-input"
                />
                {labelError && <p id={`field-label-error-${field.fieldId}`} className="field-editor-error" role="alert">{labelError}</p>}
              </div>
              <div className="field-editor-rule">
                <div>
                  <p id={`field-required-label-${field.fieldId}`} className="field-editor-rule-title">Required question</p>
                  <p className="field-editor-rule-copy">Respondents must answer before they can submit.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.mand}
                  aria-labelledby={`field-required-label-${field.fieldId}`}
                  className="field-editor-switch"
                  onClick={() => patchDraft({ mand: !draft.mand })}
                >
                  <span />
                </button>
              </div>
            </section>

            <section className="field-editor-section" aria-labelledby="field-editor-answer-heading">
              <div className="field-editor-section-heading">
                <h3 id="field-editor-answer-heading">Answer</h3>
              </div>
              <div className="field-editor-control">
                <Label htmlFor={`field-type-${field.fieldId}`}>Answer type</Label>
                <Select value={draft.type} onValueChange={chooseType}>
                  <SelectTrigger id={`field-type-${field.fieldId}`} className="field-editor-type-trigger" aria-label="Answer type">
                    <span className="field-editor-type-value">
                      <TypeIcon size={15} aria-hidden="true" />
                      <span>{meta.label}</span>
                    </span>
                  </SelectTrigger>
                  <SelectContent className="field-type-menu" position="popper" align="start" sideOffset={6}>
                    {FIELD_TYPE_META.map((fieldType) => {
                      const Icon = fieldType.icon;
                      return (
                        <SelectItem key={fieldType.value} value={fieldType.value} className="field-type-item">
                          <span className="field-type-item-icon" aria-hidden="true"><Icon size={15} /></span>
                          <span className="field-type-item-copy">
                            <span className="field-type-item-label">{fieldType.label}</span>
                            <span className="field-type-item-description">{fieldType.description}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {meta.hasPlaceholder && (
                <div className="field-editor-control">
                  <Label htmlFor={`field-placeholder-${field.fieldId}`}>
                    Placeholder <span>Optional</span>
                  </Label>
                  <Input
                    id={`field-placeholder-${field.fieldId}`}
                    value={draft.placeholder ?? ''}
                    onChange={(event) => patchDraft({ placeholder: event.target.value })}
                    placeholder="Hint shown inside the answer field"
                    className="field-editor-input"
                  />
                </div>
              )}

              {meta.hasChoices && (
                <div className="field-editor-control">
                  <div className="field-editor-options-heading">
                    <span className="field-editor-options-label">Options</span>
                    <span className="field-editor-option-count">{choices.length} {choices.length === 1 ? 'option' : 'options'}</span>
                  </div>
                  {optionsError && <p id={`field-options-error-${field.fieldId}`} className="field-editor-error" role="alert">{optionsError}</p>}
                  <div className="field-editor-options">
                    {choices.map((choice, choiceIndex) => (
                      <div className="field-editor-option" key={choiceIndex}>
                        <span className="field-editor-option-number" aria-hidden="true">{choiceIndex + 1}</span>
                        <input
                          ref={(node) => { optionRefs.current[choiceIndex] = node; }}
                          value={choice}
                          onChange={(event) => updateChoice(choiceIndex, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey && !event.altKey) {
                              event.preventDefault();
                              addChoice();
                            }
                            if (event.key === 'Backspace' && !choice && choices.length > 1) {
                              event.preventDefault();
                              removeChoice(choiceIndex);
                            }
                          }}
                          placeholder={`Option ${choiceIndex + 1}`}
                          aria-label={`Option ${choiceIndex + 1}`}
                          aria-invalid={invalidChoice === choiceIndex || undefined}
                          aria-describedby={invalidChoice === choiceIndex && optionsError ? `field-options-error-${field.fieldId}` : undefined}
                        />
                        <button
                          type="button"
                          className="field-editor-option-remove"
                          onClick={() => removeChoice(choiceIndex)}
                          disabled={choices.length <= 1}
                          aria-label={`Remove option ${choiceIndex + 1}`}
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                            <path d="M3 3l7 7M10 3l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="field-editor-add-option" onClick={addChoice}>
                    <span aria-hidden="true">+</span> Add option
                  </button>
                  <p className="field-editor-hint">Press Enter in a row to add another option.</p>
                </div>
              )}
            </section>
          </div>

          <footer className="field-editor-footer">
            <p className="field-editor-footer-note">Save the form after applying your changes.</p>
            <div className="field-editor-footer-actions">
              <button type="button" className="field-editor-cancel" onClick={() => onOpenChange(false)}>Cancel</button>
              <button type="submit" className="field-editor-save" aria-keyshortcuts="Control+Enter Meta+Enter">Apply changes</button>
            </div>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
