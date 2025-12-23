// app/employee/tasks/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const EmployeeTasksPage = () => {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employee/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.clinetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.depId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.formId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Tasks</CardTitle>
            <div className="flex gap-4">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button onClick={fetchTasks}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Form Title</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Your Status</TableHead>
                <TableHead>Team Lead Feedback</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task._id}>
                  <TableCell>{task.clinetName}</TableCell>
                  <TableCell>{task.depId?.name}</TableCell>
                  <TableCell>{task.formId?.title}</TableCell>
                  <TableCell>
                    {task.submittedBy?.firstName} {task.submittedBy?.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.employeeStatus)}>
                      {task.employeeStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.teamLeadFeedback ? (
                      <Badge variant="outline" className="bg-yellow-50">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50">
                        Not Available
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/employee/tasks/${task._id}`}>
                      <Button size="sm">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeTasksPage;