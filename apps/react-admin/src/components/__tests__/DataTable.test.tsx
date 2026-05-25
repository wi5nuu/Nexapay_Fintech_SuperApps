import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';

interface TestItem {
  id: string;
  name: string;
  status: string;
}

const columns: Column<TestItem>[] = [
  { key: 'id', header: 'ID', render: (item) => <span data-testid="cell-id">{item.id}</span> },
  { key: 'name', header: 'Name', sortable: true, render: (item) => <span>{item.name}</span> },
  { key: 'status', header: 'Status', sortable: true },
];

const data: TestItem[] = [
  { id: '1', name: 'Alice', status: 'active' },
  { id: '2', name: 'Bob', status: 'inactive' },
  { id: '3', name: 'Charlie', status: 'pending' },
];

describe('DataTable', () => {
  it('renders all column headers', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
      />,
    );
    expect(screen.getByText('ID')).toBeDefined();
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
  });

  it('renders all data rows', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
      />,
    );
    expect(screen.getAllByTestId('cell-id')).toHaveLength(3);
  });

  it('shows empty message when data is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyMessage="No items found"
      />,
    );
    expect(screen.getByText('No items found')).toBeDefined();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        loading={true}
        keyExtractor={(item) => item.id}
      />,
    );
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });

  it('renders sort indicators on sortable columns', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
      />,
    );
    const nameHeader = screen.getByText('Name');
    expect(nameHeader.closest('th')?.classList.contains('cursor-pointer')).toBe(true);
  });

  it('renders pagination when total > pageSize', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={50}
        page={1}
        pageSize={10}
        keyExtractor={(item) => item.id}
      />,
    );
    expect(screen.getByText('Previous')).toBeDefined();
    expect(screen.getByText('Next')).toBeDefined();
  });

  it('disables previous button on first page', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        total={50}
        page={1}
        pageSize={10}
        keyExtractor={(item) => item.id}
      />,
    );
    expect(screen.getByText('Previous')).toBeDisabled();
  });
});
