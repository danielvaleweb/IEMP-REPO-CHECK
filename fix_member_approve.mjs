import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/pages/Admin.tsx';
let content = readFileSync(filePath, 'utf8');

// Fix 1: Replace the broken orphan "}}" + onDelete with the full props
// The broken section looks like (with CRLF):
//   } : undefined}\r\n
//   }}\r\n
//   onDelete=...\r\n
const brokenBlock = '                                         } : undefined}\r\n                                         }}\r\n                                         onDelete={(canDelete || member.email === user?.email) ? () => handleDelete(member, "members") : undefined}';
const fixedBlock = `                                         } : undefined}
                                         onUpdateRole={(m) => {
                                           setMemberToProcess(m);
                                           setIsRoleEditModalOpen(true);
                                         }}
                                         onReject={(m) => {
                                           setMemberToProcess(m);
                                           setIsMemberRejectModalOpen(true);
                                         }}
                                         onApprove={(memberId: string) => {
                                           setMembers((prev: any[]) => prev.map((m: any) =>
                                             m.id === memberId ? { ...m, status: 'active' } : m
                                           ));
                                         }}
                                         onDelete={(canDelete || member.email === user?.email) ? () => handleDelete(member, "members") : undefined}`.replace(/\n/g, '\r\n');

if (content.includes(brokenBlock)) {
  content = content.replace(brokenBlock, fixedBlock);
  writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Fixed TeamMember props');
} else {
  // Try without CRLF
  const brokenLF = brokenBlock.replace(/\r\n/g, '\n');
  if (content.includes(brokenLF)) {
    content = content.replace(brokenLF, fixedBlock.replace(/\r\n/g, '\n'));
    writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS (LF): Fixed TeamMember props');
  } else {
    console.log('NOT FOUND. Searching for partial...');
    const idx = content.indexOf('onDelete={(canDelete || member.email === user?.email) ? () => handleDelete(member, "members") : undefined}');
    console.log('onDelete index:', idx);
    // Show 200 chars before the match
    if (idx > 0) {
      console.log('Context:', JSON.stringify(content.substring(idx - 300, idx + 100)));
    }
  }
}
