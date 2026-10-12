/**
 * Test Role Update Script
 * Run this in browser console to test role update functionality
 */

console.log('🧪 Testing Role Update Functionality...');

// Get current session data
const userSession = localStorage.getItem('user_session');
const companySession = localStorage.getItem('active_company');

if (!userSession || !companySession) {
    console.log('Missing session data needed for testing');
} else {
    const user = JSON.parse(userSession);
    const company = JSON.parse(companySession);
    
    console.log('👤 Current User:', {
        id: user.id,
        name: user.name,
        role: user.role
    });
    
    console.log('🏢 Company:', {
        id: company.id,
        name: company.name,
        type: company.type
    });
    
    // Test role update API
    const testRoleUpdate = async (targetUserId, newRole) => {
        const token = localStorage.getItem('token') || user.token;
        if (!token) {
            console.log('❌ No token available');
            return;
        }
        
        console.log(`🧪 Testing role update: User ${targetUserId} → ${newRole}`);
        
        try {
            const response = await fetch(`/api/companies/${company.id}/users/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: targetUserId,
                    role: newRole
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Role update successful:', data);
                
                // If updating current user's role, update session
                if (targetUserId === user.id) {
                    console.log('🔄 Updating current user session...');
                    const updatedUser = { ...user, role: data.user.role };
                    localStorage.setItem('user_session', JSON.stringify(updatedUser));
                    console.log('Session updated. Role is now:', data.user.role);
                    
                    // Ask if user wants to reload
                    if (confirm('Role updated! Reload page to see changes?')) {
                        window.location.reload();
                    }
                }
                
                return data;
            } else {
                console.error('❌ Role update failed:', data);
                return null;
            }
        } catch (error) {
            console.error('❌ Role update error:', error);
            return null;
        }
    };
    
    // Test with current user
    console.log('\n📋 Available test scenarios:');
    console.log('1. Test updating your own role to finance:');
    console.log(`   testRoleUpdate('${user.id}', 'finance')`);
    console.log('2. Test updating your own role back to manager:');
    console.log(`   testRoleUpdate('${user.id}', 'manager')`);
    
    // Expose function globally for manual testing
    window.testRoleUpdate = testRoleUpdate;
    
    console.log('\n💡 Usage:');
    console.log('testRoleUpdate(userId, newRole)');
    console.log('Available roles for', company.type, 'company:', 
        company.type === 'buyer' ? ['buyer', 'manager', 'finance'] : ['admin', 'manager', 'finance']
    );
}