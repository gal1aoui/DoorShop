import { Box, Container } from "@mui/material";
import AdminGuard from "@/components/admin/admin-guard";
import AdminNav from "@/components/admin/admin-nav";

export const metadata = {
  title: "Admin Dashboard | Boudokhane Doors",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <AdminNav />
        <Box
          sx={{
            flex: 1,
            backgroundColor: "var(--surface)",
            minHeight: "100vh",
            overflowY: "auto",
          }}
        >
          <Container
            maxWidth="lg"
            sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}
          >
            {children}
          </Container>
        </Box>
      </Box>
    </AdminGuard>
  );
}
