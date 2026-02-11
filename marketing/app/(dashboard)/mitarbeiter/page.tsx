'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Trash2,
    X,
    Loader2,
    UserPlus,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import api from '@/lib/api'

interface Employee {
    employee_id: string
    first_name: string
    last_name: string
    position: string
    phone: string
    email: string
    hourly_rate: number
    is_active: boolean
    qualification: string
}

interface EmployeeListResponse {
    items: Employee[]
    total: number
    page: number
    per_page: number
    total_pages: number
}

export default function MitarbeiterPage() {
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [showForm, setShowForm] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
    const [openMenu, setOpenMenu] = useState<string | null>(null)
    const perPage = 15

    const queryClient = useQueryClient()

    // Fetch employees
    const { data, isLoading, error } = useQuery<EmployeeListResponse>({
        queryKey: ['employees', page, perPage],
        queryFn: async () => {
            const res = await api.get('/api/employees/', {
                params: { skip: (page - 1) * perPage, limit: perPage },
            })
            return res.data
        },
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/api/employees/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    })

    // Filter by search locally
    const employees = data?.items?.filter((emp) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            emp.first_name?.toLowerCase().includes(q) ||
            emp.last_name?.toLowerCase().includes(q) ||
            emp.position?.toLowerCase().includes(q) ||
            emp.email?.toLowerCase().includes(q)
        )
    }) || []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">
                        Mitarbeiter
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {data?.total ?? 0} Mitarbeiter insgesamt
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingEmployee(null)
                        setShowForm(true)
                    }}
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Mitarbeiter hinzufügen
                </button>
            </div>

            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Nach Name, Position oder E-Mail suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-sm">
                            Fehler beim Laden der Mitarbeiter. Ist der Backend-Server gestartet?
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Backend wird unter {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'} erwartet.
                        </p>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="text-center py-20">
                        <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Noch keine Mitarbeiter vorhanden.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            Ersten Mitarbeiter anlegen →
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                                            Name
                                        </th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                                            Position
                                        </th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                                            E-Mail
                                        </th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                                            Stundensatz
                                        </th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                                            Status
                                        </th>
                                        <th className="w-12 px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map((emp) => (
                                        <tr
                                            key={emp.employee_id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                                        <span className="text-primary-700 text-xs font-medium">
                                                            {emp.first_name?.[0]}
                                                            {emp.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {emp.first_name} {emp.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 md:hidden">
                                                            {emp.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-700">
                                                {emp.position || '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                                                {emp.email || '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-700 hidden lg:table-cell">
                                                {emp.hourly_rate
                                                    ? `${Number(emp.hourly_rate).toFixed(2)} €/h`
                                                    : '—'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${emp.is_active
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    {emp.is_active ? 'Aktiv' : 'Inaktiv'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 relative">
                                                <button
                                                    onClick={() =>
                                                        setOpenMenu(
                                                            openMenu === emp.employee_id
                                                                ? null
                                                                : emp.employee_id
                                                        )
                                                    }
                                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                                {openMenu === emp.employee_id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenMenu(null)}
                                                        />
                                                        <div className="absolute right-5 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingEmployee(emp)
                                                                    setShowForm(true)
                                                                    setOpenMenu(null)
                                                                }}
                                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                Bearbeiten
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (
                                                                        confirm(
                                                                            `${emp.first_name} ${emp.last_name} wirklich löschen?`
                                                                        )
                                                                    ) {
                                                                        deleteMutation.mutate(emp.employee_id)
                                                                    }
                                                                    setOpenMenu(null)
                                                                }}
                                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Löschen
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data && data.total_pages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                                <p className="text-sm text-gray-500">
                                    Seite {data.page} von {data.total_pages}
                                </p>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            setPage((p) => Math.min(data.total_pages, p + 1))
                                        }
                                        disabled={page >= data.total_pages}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <EmployeeFormModal
                    employee={editingEmployee}
                    onClose={() => {
                        setShowForm(false)
                        setEditingEmployee(null)
                    }}
                />
            )}
        </div>
    )
}

// ========================================
// Employee Form Modal
// ========================================

interface EmployeeFormModalProps {
    employee: Employee | null
    onClose: () => void
}

function EmployeeFormModal({ employee, onClose }: EmployeeFormModalProps) {
    const queryClient = useQueryClient()
    const isEdit = !!employee

    const [formData, setFormData] = useState({
        first_name: employee?.first_name || '',
        last_name: employee?.last_name || '',
        position: employee?.position || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        hourly_rate: employee?.hourly_rate?.toString() || '',
        qualification: employee?.qualification || '',
    })

    const [error, setError] = useState('')

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : 0,
            }
            if (isEdit) {
                return api.put(`/api/employees/${employee.employee_id}`, payload)
            }
            return api.post('/api/employees/', payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] })
            onClose()
        },
        onError: (err: any) => {
            setError(
                err.response?.data?.detail || 'Ein Fehler ist aufgetreten'
            )
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.first_name || !formData.last_name) {
            setError('Vor- und Nachname sind Pflichtfelder')
            return
        }
        mutation.mutate(formData)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setError('')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 font-display">
                        {isEdit ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vorname *
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                placeholder="Max"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nachname *
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                placeholder="Mustermann"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Position
                        </label>
                        <input
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            placeholder="z.B. Teamleiter, Monteur"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                E-Mail
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                placeholder="max@firma.de"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefon
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                placeholder="+49 170 1234567"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stundensatz (€)
                            </label>
                            <input
                                type="number"
                                name="hourly_rate"
                                step="0.01"
                                value={formData.hourly_rate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                placeholder="25.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Qualifikation
                            </label>
                            <input
                                type="text"
                                name="qualification"
                                value={formData.qualification}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                placeholder="z.B. Meister, Geselle"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isEdit ? (
                                'Speichern'
                            ) : (
                                'Erstellen'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
