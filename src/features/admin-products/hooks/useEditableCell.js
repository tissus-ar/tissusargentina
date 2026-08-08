import { useRef, useState } from 'react'

// Edición inline de una celda numérica de la tabla de productos. Lo usan las celdas de stock,
// precio y descuento, que antes repetían este mismo bloque tres veces.
//
// Mantiene la convención del repo: `local` vale null en reposo y el valor mostrado sale directo de
// la fuente (`current`), así que un cambio externo (Realtime / refetch) se refleja solo, sin efecto
// de sincronización. Solo deja de ser null mientras se edita o mientras hay una mutación en vuelo.
//
// Escape descarta y sale. El detalle que obliga a usar una ref: cancelar desmonta el <Input> (la
// celda hace `if (editing) return <Input/>`), y sacar del DOM al elemento con foco puede disparar
// un blur — que llamaría a `save` y guardaría justo lo que se quiso descartar. `cancelled` se lee
// DENTRO de save, así que no queda atada al valor que `local` tenía en el render que creó la
// función; con un `setLocal(null)` a secas, save seguiría viendo el borrador viejo y lo guardaría.
export function useEditableCell({ current, onSave }) {
  const [local, setLocal] = useState(null)
  const [editing, setEditing] = useState(false)
  const cancelled = useRef(false)

  const value = local ?? current

  const startEditing = () => {
    cancelled.current = false
    setLocal(current)
    setEditing(true)
  }

  const save = async () => {
    setEditing(false)
    if (cancelled.current) {
      cancelled.current = false
      setLocal(null)
      return
    }
    const numericValue = Number(value)
    if (numericValue !== current) {
      setLocal(numericValue)
      await onSave(numericValue)
    }
    setLocal(null)
  }

  const cancel = () => {
    cancelled.current = true
    setLocal(null)
    setEditing(false)
  }

  // Enter delega en el blur (que llama a save) en vez de guardar directo: así hay un solo camino de
  // guardado y no se puede guardar dos veces si el blur llega igual.
  const inputProps = {
    value,
    onChange: (e) => setLocal(e.target.value),
    onBlur: save,
    onKeyDown: (e) => {
      if (e.key === 'Enter') e.currentTarget.blur()
      else if (e.key === 'Escape') cancel()
    },
    autoFocus: true,
  }

  return { editing, value, startEditing, inputProps }
}
