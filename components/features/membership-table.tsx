"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MembershipRowActions } from "@/components/features/admin/membership-row-actions";

interface MembershipRow {
  id: string;
  studentId: string;
  extracurricularId: string;
  studentName: string;
  nis: string;
  className: string | null;
  ekName: string;
  status: string;
  joinedAt: Date;
}

export function MembershipTable({ rows }: { rows: MembershipRow[] }) {
  const [classFilter, setClassFilter] = useState("");
  const [ekFilter, setEkFilter] = useState("");

  const classOptions = Array.from(
    new Set(rows.map((r) => r.className).filter((c): c is string => Boolean(c))).add(
      ""
    )
  ).sort();

  const ekOptions = Array.from(
    new Set(rows.map((r) => r.ekName)).add("")
  ).sort();

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!classFilter || r.className === classFilter) &&
          (!ekFilter || r.ekName === ekFilter)
      ),
    [rows, classFilter, ekFilter]
  );

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap items-end gap-3 border-b p-3">
        {classOptions.length > 0 && (
          <div className="space-y-1">
            <Label htmlFor="classFilter">Filter Kelas</Label>
            <Select
              id="classFilter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-48"
            >
              <option value="">Semua Kelas</option>
              {classOptions
                .filter((c) => c)
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </Select>
          </div>
        )}
        {ekOptions.length > 1 && (
          <div className="space-y-1">
            <Label htmlFor="ekFilter">Filter Ekstrakurikuler</Label>
            <Select
              id="ekFilter"
              value={ekFilter}
              onChange={(e) => setEkFilter(e.target.value)}
              className="w-56"
            >
              <option value="">Semua Ekstrakurikuler</option>
              {ekOptions
                .filter((e) => e)
                .map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
            </Select>
          </div>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} anggota
        </div>
      </div>
      <div className="overflow-x-auto p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Ekstrakurikuler</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Belum ada keanggotaan.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.studentName}</TableCell>
                <TableCell>{m.nis}</TableCell>
                <TableCell>{m.className ?? "—"}</TableCell>
                <TableCell>{m.ekName}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      m.status === "AKTIF"
                        ? "success"
                        : m.status === "KELUAR"
                          ? "destructive"
                          : "muted"
                    }
                  >
                    {m.status}
                  </Badge>
                </TableCell>
                <TableCell>{m.joinedAt.toLocaleDateString("id-ID")}</TableCell>
                <TableCell className="text-right">
                  <MembershipRowActions
                    membership={{
                      id: m.id,
                      studentId: m.studentId,
                      extracurricularId: m.extracurricularId,
                      status: m.status,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
