console.log('Script started');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zrxebrrynzlyrmrdnxvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyeGVicnJ5bnpseXJtcmRueHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzU1MTYsImV4cCI6MjA3Nzg1MTUxNn0.daB7LOtTBHGHTq7BNngqQMH7PkiqyI5BlSk1gZTB9JM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmployees() {
    const { data, error } = await supabase
        .from('t_employees')
        .select('name, contract_type, role')
        .is('is_active', true) // Filter active only, as per page logic
        .order('name');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Total Active Employees:', data.length);
    console.log('Distinct Contract Types:', [...new Set(data.map(e => e.contract_type))]);

    // Check specifically for 'Freelance' or similar
    const potentialFreelancers = data.filter(e =>
        (e.contract_type && e.contract_type.toLowerCase().includes('free')) ||
        (e.role && e.role.toLowerCase().includes('free'))
    );

    console.log('\nPotential Freelancers (by string match):');
    potentialFreelancers.forEach(e => {
        console.log(`${e.name}: contract_type='${e.contract_type}', role='${e.role}'`);
    });

    const exactFreelancers = data.filter(e => e.contract_type === 'Freelance');
    console.log('\nExact match "Freelance":', exactFreelancers.length);
}

checkEmployees();
