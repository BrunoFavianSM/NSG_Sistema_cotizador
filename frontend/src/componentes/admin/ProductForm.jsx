import { useMemo } from 'react';
import Button from '../ui/Button';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import SwitchField from '../ui/SwitchField';
import TextAreaField from '../ui/TextAreaField';
import FormSection from './FormSection';

export const CATEGORIAS = ['procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case'];
const RAM_TYPES = ['DDR4', 'DDR5'];
const FORM_FACTORS = ['ATX', 'Micro-ATX', 'Mini-ITX'];

export const PRODUCTO_INICIAL = {
  nombre: '',
  categoria: 'procesador',
  socket: '',
  ram_type: '',
  form_factor: '',
  wattage: '',
  tdp: '',
  precio_base: '',
  stock: '',
  disponible_a_pedido: false,
  tiempo_entrega_dias: '',
  descripcion_tecnica: '',
  imagen_url: '',
};

function normalizarCampo(name, value) {
  if (name === 'disponible_a_pedido') return Boolean(value);
  return value;
}

export default function ProductForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
  error = '',
}) {
  const camposVisibles = useMemo(() => {
    const categoria = value.categoria;
    return {
      socket: ['procesador', 'placa_madre'].includes(categoria),
      ram_type: ['ram', 'placa_madre'].includes(categoria),
      form_factor: ['placa_madre', 'case'].includes(categoria),
      wattage: categoria === 'fuente',
      tdp: ['procesador', 'gpu'].includes(categoria),
    };
  }, [value.categoria]);

  const setCampo = (name, fieldValue) => {
    onChange((prev) => ({
      ...prev,
      [name]: normalizarCampo(name, fieldValue),
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-[var(--radius-sm)] border border-[color:rgba(255,69,58,0.4)] bg-[color:rgba(255,69,58,0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <FormSection
        title="Información base"
        description="Define los datos principales del producto que verá el usuario."
      >
        <InputField
          id="producto-nombre"
          label="Nombre"
          required
          value={value.nombre}
          onChange={(event) => setCampo('nombre', event.target.value)}
          placeholder="Ejemplo: AMD Ryzen 7 7700X"
          className="sm:col-span-2"
        />

        <SelectField
          id="producto-categoria"
          label="Categoría"
          required
          value={value.categoria}
          onChange={(event) => setCampo('categoria', event.target.value)}
          options={CATEGORIAS.map((categoria) => ({
            value: categoria,
            label: categoria.replace('_', ' '),
          }))}
        />

        <InputField
          id="producto-precio"
          type="number"
          step="0.01"
          min="0"
          label="Precio base"
          required
          value={value.precio_base}
          onChange={(event) => setCampo('precio_base', event.target.value)}
          placeholder="0.00"
        />

        <InputField
          id="producto-stock"
          type="number"
          min="0"
          label="Stock"
          required
          value={value.stock}
          onChange={(event) => setCampo('stock', event.target.value)}
          placeholder="0"
        />

        <InputField
          id="producto-url"
          label="URL de imagen"
          value={value.imagen_url}
          onChange={(event) => setCampo('imagen_url', event.target.value)}
          placeholder="https://..."
        />
      </FormSection>

      <SwitchField
        id="producto-pedido"
        label="Disponible a pedido"
        description="Activa esta opción cuando no exista stock inmediato."
        checked={value.disponible_a_pedido}
        onChange={(checked) => setCampo('disponible_a_pedido', checked)}
      />

      {value.disponible_a_pedido ? (
        <InputField
          id="producto-entrega"
          type="number"
          min="1"
          label="Tiempo de entrega (días)"
          value={value.tiempo_entrega_dias}
          onChange={(event) => setCampo('tiempo_entrega_dias', event.target.value)}
          placeholder="7"
        />
      ) : null}

      <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          Especificaciones avanzadas
        </summary>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {camposVisibles.socket ? (
            <InputField
              id="producto-socket"
              label="Socket"
              value={value.socket}
              onChange={(event) => setCampo('socket', event.target.value)}
              placeholder="AM5, LGA1700..."
            />
          ) : null}

          {camposVisibles.ram_type ? (
            <SelectField
              id="producto-ram-type"
              label="Tipo de RAM"
              value={value.ram_type}
              onChange={(event) => setCampo('ram_type', event.target.value)}
              options={[
                { value: '', label: 'Seleccionar...' },
                ...RAM_TYPES.map((item) => ({ value: item, label: item })),
              ]}
            />
          ) : null}

          {camposVisibles.form_factor ? (
            <SelectField
              id="producto-form-factor"
              label="Form factor"
              value={value.form_factor}
              onChange={(event) => setCampo('form_factor', event.target.value)}
              options={[
                { value: '', label: 'Seleccionar...' },
                ...FORM_FACTORS.map((item) => ({ value: item, label: item })),
              ]}
            />
          ) : null}

          {camposVisibles.wattage ? (
            <InputField
              id="producto-wattage"
              type="number"
              min="0"
              label="Potencia (W)"
              value={value.wattage}
              onChange={(event) => setCampo('wattage', event.target.value)}
            />
          ) : null}

          {camposVisibles.tdp ? (
            <InputField
              id="producto-tdp"
              type="number"
              min="0"
              label="TDP (W)"
              value={value.tdp}
              onChange={(event) => setCampo('tdp', event.target.value)}
            />
          ) : null}

          <TextAreaField
            id="producto-descripcion"
            label="Descripción técnica"
            value={value.descripcion_tecnica}
            onChange={(event) => setCampo('descripcion_tecnica', event.target.value)}
            className="sm:col-span-2"
            rows={4}
          />
        </div>
      </details>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
}
